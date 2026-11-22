import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { MovementType, Prisma } from '@prisma/client';

export const getMovements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const productId = req.query.productId as string;
    const warehouseId = req.query.warehouseId as string;
    const type = req.query.type as MovementType;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {
      ...(productId ? { productId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { referenceNumber: { contains: search, mode: 'insensitive' } },
              { product: { name: { contains: search, mode: 'insensitive' } } },
              { product: { sku: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          supplier: { select: { id: true, companyName: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const recordStockMovement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, warehouseId, type, quantity, referenceNumber, destination, supplierId, locationId, notes } =
      req.body;

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });
    }

    // Atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify Product & Warehouse exist
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Product not found');

      const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) throw new Error('Warehouse not found');

      // 2. Find or prepare existing inventory record
      let inventory = await tx.inventory.findFirst({
        where: {
          productId,
          warehouseId,
          ...(locationId ? { locationId } : {}),
        },
      });

      if (!inventory) {
        if (type === 'STOCK_OUT') {
          throw new Error('Cannot stock out: No inventory exists for this product in the selected warehouse/location');
        }
        inventory = await tx.inventory.create({
          data: {
            productId,
            warehouseId,
            locationId: locationId || null,
            quantity: 0,
          },
        });
      }

      // 3. Apply quantity delta
      let newQuantity = inventory.quantity;

      if (type === 'STOCK_IN') {
        newQuantity += quantity;
      } else if (type === 'STOCK_OUT') {
        if (inventory.quantity < quantity) {
          throw new Error(
            `Insufficient stock. Available: ${inventory.quantity} ${product.unit}, Requested: ${quantity} ${product.unit}`
          );
        }
        newQuantity -= quantity;
      } else if (type === 'ADJUSTMENT') {
        newQuantity = quantity; // Absolute adjustment
      }

      // 4. Update Inventory
      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity },
      });

      // 5. Create Movement record
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          warehouseId,
          type: type as MovementType,
          quantity,
          referenceNumber: referenceNumber || `MOV-${Date.now()}`,
          destination: destination || null,
          supplierId: supplierId || null,
          notes: notes || null,
          createdById: req.user?.userId || null,
        },
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
      });

      // 6. Check low stock notification trigger
      const totalProductStock = await tx.inventory.aggregate({
        where: { productId },
        _sum: { quantity: true },
      });

      const aggregatedStock = totalProductStock._sum.quantity || 0;

      if (aggregatedStock === 0) {
        await tx.notification.create({
          data: {
            title: 'Product Out of Stock',
            message: `${product.name} (${product.sku}) has reached 0 units remaining.`,
            type: 'OUT_OF_STOCK',
            link: `/inventory?search=${product.sku}`,
          },
        });
      } else if (aggregatedStock <= product.minStockLevel) {
        // Prevent flood of duplicate unread notifications
        const recentAlert = await tx.notification.findFirst({
          where: {
            type: 'LOW_STOCK',
            message: { contains: product.sku },
            isRead: false,
          },
        });

        if (!recentAlert) {
          await tx.notification.create({
            data: {
              title: 'Low Stock Alert',
              message: `${product.name} (${product.sku}) stock is low (${aggregatedStock} remaining). Threshold: ${product.minStockLevel}`,
              type: 'LOW_STOCK',
              link: `/inventory?search=${product.sku}`,
            },
          });
        }
      }

      // 7. Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: `STOCK_MOVEMENT_${type}`,
          entity: 'INVENTORY',
          entityId: updatedInventory.id,
          details: `${type} of ${quantity} ${product.unit} for ${product.name} in warehouse ${warehouse.name}`,
        },
      });

      return { movement, updatedInventory, currentStock: newQuantity };
    });

    return res.status(201).json({
      success: true,
      message: `Stock movement ${type} recorded successfully`,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to record movement' });
  }
};
