import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { POStatus, Prisma } from '@prisma/client';

export const getPurchaseOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as POStatus;
    const supplierId = req.query.supplierId as string;
    const warehouseId = req.query.warehouseId as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {
      ...(status ? { status } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { supplier: { companyName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: { select: { id: true, companyName: true, name: true, email: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: orders,
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

export const getPurchaseOrderById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true, costPrice: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    return res.json({ success: true, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplierId, warehouseId, expectedDate, notes, taxRate = 18, items } = req.body;

    const orderNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        productId: item.productId,
        quantity: item.quantity,
        receivedQuantity: 0,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const po = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId,
          warehouseId,
          status: 'PENDING',
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
          notes,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          createdById: req.user?.userId || null,
          items: {
            create: formattedItems,
          },
        },
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: { product: true },
          },
        },
      });

      // Create notification for warehouse manager
      await tx.notification.create({
        data: {
          title: 'New Purchase Order Created',
          message: `Order #${created.orderNumber} created for ${created.supplier.companyName} (₹${totalAmount.toFixed(2)})`,
          type: 'PENDING_PO',
          link: `/purchase-orders/${created.id}`,
        },
      });

      return created;
    });

    return res.status(201).json({ success: true, message: 'Purchase order created successfully', data: po });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePOStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, receivedItems } = req.body;

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, warehouse: true, supplier: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (existingOrder.status === 'RECEIVED' || existingOrder.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot modify a purchase order that is already ${existingOrder.status}.`,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let finalStatus: POStatus = status;

      // If items are received, update quantities and warehouse inventory
      if (receivedItems && receivedItems.length > 0) {
        let allReceived = true;

        for (const itemReceipt of receivedItems) {
          const poItem = existingOrder.items.find((i) => i.id === itemReceipt.itemId);
          if (!poItem) continue;

          const qtyToAdd = Math.max(0, itemReceipt.quantityReceived);
          if (qtyToAdd > 0) {
            const newTotalReceived = poItem.receivedQuantity + qtyToAdd;
            if (newTotalReceived > poItem.quantity) {
              throw new Error(`Received quantity exceeds ordered quantity for item ${poItem.id}`);
            }

            // 1. Update PO Item
            await tx.purchaseOrderItem.update({
              where: { id: poItem.id },
              data: { receivedQuantity: newTotalReceived },
            });

            // 2. Increase Inventory in the warehouse
            let inv = await tx.inventory.findFirst({
              where: {
                productId: poItem.productId,
                warehouseId: existingOrder.warehouseId,
              },
            });

            if (!inv) {
              inv = await tx.inventory.create({
                data: {
                  productId: poItem.productId,
                  warehouseId: existingOrder.warehouseId,
                  quantity: qtyToAdd,
                },
              });
            } else {
              await tx.inventory.update({
                where: { id: inv.id },
                data: { quantity: { increment: qtyToAdd } },
              });
            }

            // 3. Record Stock Movement
            await tx.stockMovement.create({
              data: {
                productId: poItem.productId,
                warehouseId: existingOrder.warehouseId,
                type: 'STOCK_IN',
                quantity: qtyToAdd,
                referenceNumber: existingOrder.orderNumber,
                supplierId: existingOrder.supplierId,
                notes: `Received from PO #${existingOrder.orderNumber}`,
                createdById: req.user?.userId || null,
              },
            });

            if (newTotalReceived < poItem.quantity) {
              allReceived = false;
            }
          } else if (poItem.receivedQuantity < poItem.quantity) {
            allReceived = false;
          }
        }

        finalStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      }

      const orderUpdated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: finalStatus,
          ...(finalStatus === 'RECEIVED' ? { receivedDate: new Date() } : {}),
        },
        include: { items: { include: { product: true } } },
      });

      // Notification
      await tx.notification.create({
        data: {
          title: `Purchase Order ${finalStatus}`,
          message: `Order #${existingOrder.orderNumber} status changed to ${finalStatus}`,
          type: finalStatus === 'RECEIVED' ? 'ORDER_RECEIVED' : 'PENDING_PO',
          link: `/purchase-orders/${id}`,
        },
      });

      return orderUpdated;
    });

    return res.json({ success: true, message: `Order updated to ${updated.status}`, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
