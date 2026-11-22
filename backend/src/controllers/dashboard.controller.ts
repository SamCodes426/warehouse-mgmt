import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalProducts,
      inventorySum,
      totalWarehouses,
      totalSuppliers,
      pendingPOs,
      products,
      recentMovements,
      recentPOs,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.inventory.aggregate({
        _sum: { quantity: true },
      }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.purchaseOrder.count({
        where: { status: { in: ['PENDING', 'ORDERED', 'PARTIALLY_RECEIVED'] } },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          minStockLevel: true,
          costPrice: true,
          category: { select: { name: true } },
          inventories: { select: { quantity: true, warehouse: { select: { name: true } } } },
        },
      }),
      prisma.stockMovement.findMany({
        take: 7,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          warehouse: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.purchaseOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { companyName: true } },
          warehouse: { select: { name: true } },
        },
      }),
    ]);

    // Calculate total inventory value and identify low stock products
    let totalInventoryValue = 0;
    const lowStockItems: any[] = [];
    const categoryCountMap: Record<string, number> = {};
    const warehouseStockMap: Record<string, number> = {};

    products.forEach((prod) => {
      const totalUnits = prod.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
      const value = totalUnits * Number(prod.costPrice);
      totalInventoryValue += value;

      if (totalUnits <= prod.minStockLevel) {
        lowStockItems.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          currentStock: totalUnits,
          minStockLevel: prod.minStockLevel,
          category: prod.category.name,
          status: totalUnits === 0 ? 'Out of Stock' : 'Low Stock',
        });
      }

      // Category breakdown
      const catName = prod.category?.name || 'Uncategorized';
      categoryCountMap[catName] = (categoryCountMap[catName] || 0) + totalUnits;

      // Warehouse breakdown
      prod.inventories.forEach((inv) => {
        const whName = inv.warehouse?.name || 'Unknown';
        warehouseStockMap[whName] = (warehouseStockMap[whName] || 0) + inv.quantity;
      });
    });

    // Monthly stock in vs out calculation (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const movements = await prisma.stockMovement.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        type: { in: ['STOCK_IN', 'STOCK_OUT'] },
      },
      select: {
        type: true,
        quantity: true,
        createdAt: true,
      },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats: Record<string, { month: string; stockIn: number; stockOut: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]}`;
      monthlyStats[key] = { month: key, stockIn: 0, stockOut: 0 };
    }

    movements.forEach((mov) => {
      const key = monthNames[new Date(mov.createdAt).getMonth()];
      if (monthlyStats[key]) {
        if (mov.type === 'STOCK_IN') {
          monthlyStats[key].stockIn += mov.quantity;
        } else if (mov.type === 'STOCK_OUT') {
          monthlyStats[key].stockOut += mov.quantity;
        }
      }
    });

    const categoryDistribution = Object.entries(categoryCountMap).map(([name, value]) => ({ name, value }));
    const warehouseDistribution = Object.entries(warehouseStockMap).map(([name, units]) => ({ name, units }));

    return res.json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalStockUnits: inventorySum._sum.quantity || 0,
          totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
          lowStockCount: lowStockItems.length,
          totalWarehouses,
          totalSuppliers,
          pendingPurchaseOrders: pendingPOs,
        },
        monthlyMovementChart: Object.values(monthlyStats),
        categoryDistribution,
        warehouseDistribution,
        lowStockItems: lowStockItems.slice(0, 6),
        recentMovements,
        recentPurchaseOrders: recentPOs,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
