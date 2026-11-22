import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const categoryId = (req.query.categoryId as string) || '';
    const warehouseId = (req.query.warehouseId as string) || '';
    const status = (req.query.status as string) || ''; // 'in_stock', 'low_stock', 'out_of_stock'

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          defaultSupplier: { select: { id: true, companyName: true, name: true } },
          inventories: {
            include: {
              warehouse: { select: { id: true, name: true, code: true } },
              location: { select: { id: true, code: true, zone: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format items with aggregated stock
    const formatted = products.map((prod) => {
      const totalStock = prod.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
      let stockStatus = 'in_stock';
      if (totalStock === 0) stockStatus = 'out_of_stock';
      else if (totalStock <= prod.minStockLevel) stockStatus = 'low_stock';

      return {
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        description: prod.description,
        unit: prod.unit,
        costPrice: Number(prod.costPrice),
        sellingPrice: Number(prod.sellingPrice),
        minStockLevel: prod.minStockLevel,
        category: prod.category,
        supplier: prod.defaultSupplier,
        totalStock,
        stockStatus,
        inventories: prod.inventories,
        createdAt: prod.createdAt,
      };
    });

    // Filter by status if requested
    const filtered = status ? formatted.filter((item) => item.stockStatus === status) : formatted;

    return res.json({
      success: true,
      data: filtered,
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

export const getProductById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        defaultSupplier: true,
        inventories: {
          include: {
            warehouse: true,
            location: true,
          },
        },
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            warehouse: { select: { name: true, code: true } },
            createdBy: { select: { name: true } },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const totalStock = product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);

    return res.json({
      success: true,
      data: {
        ...product,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        totalStock,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      unit,
      costPrice,
      sellingPrice,
      minStockLevel,
      defaultSupplierId,
      initialWarehouseId,
      initialLocationId,
      initialStock = 0,
    } = req.body;

    // Check unique sku & barcode
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku },
          ...(barcode ? [{ barcode }] : []),
        ],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.sku === sku ? 'Product with this SKU already exists' : 'Product with this barcode already exists',
      });
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          sku: sku.toUpperCase(),
          barcode: barcode || null,
          description: description || null,
          categoryId,
          unit: unit || 'pcs',
          costPrice,
          sellingPrice,
          minStockLevel: minStockLevel ?? 10,
          defaultSupplierId: defaultSupplierId || null,
        },
        include: {
          category: true,
          defaultSupplier: true,
        },
      });

      // If initial stock provided with warehouse
      if (initialWarehouseId && initialStock > 0) {
        await tx.inventory.create({
          data: {
            productId: created.id,
            warehouseId: initialWarehouseId,
            locationId: initialLocationId || null,
            quantity: initialStock,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: created.id,
            warehouseId: initialWarehouseId,
            type: 'STOCK_IN',
            quantity: initialStock,
            referenceNumber: 'INITIAL-STOCK',
            notes: 'Initial stock on product creation',
            createdById: req.user?.userId || null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_PRODUCT',
          entity: 'PRODUCT',
          entityId: created.id,
          details: `Created product ${created.name} (${created.sku})`,
        },
      });

      return created;
    });

    return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sku && { sku: data.sku.toUpperCase() }),
        ...(data.barcode !== undefined && { barcode: data.barcode || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.unit && { unit: data.unit }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.minStockLevel !== undefined && { minStockLevel: data.minStockLevel }),
        ...(data.defaultSupplierId !== undefined && { defaultSupplierId: data.defaultSupplierId || null }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_PRODUCT',
        entity: 'PRODUCT',
        entityId: updated.id,
        details: `Updated product ${updated.name}`,
      },
    });

    return res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product has active inventory
    const inventoryCount = await prisma.inventory.aggregate({
      where: { productId: id },
      _sum: { quantity: true },
    });

    if ((inventoryCount._sum.quantity || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with existing inventory stock. Please adjust or stock out first.',
      });
    }

    await prisma.product.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DELETE_PRODUCT',
        entity: 'PRODUCT',
        entityId: id,
        details: `Deleted product ID ${id}`,
      },
    });

    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
