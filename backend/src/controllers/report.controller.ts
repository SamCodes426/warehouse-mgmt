import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getInventoryReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { warehouseId, categoryId, filter } = req.query;

    const products = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId: categoryId as string } : {}),
      },
      include: {
        category: true,
        defaultSupplier: true,
        inventories: {
          where: {
            ...(warehouseId ? { warehouseId: warehouseId as string } : {}),
          },
          include: { warehouse: true, location: true },
        },
      },
    });

    const report = products
      .map((p) => {
        const totalUnits = p.inventories.reduce((acc, curr) => acc + curr.quantity, 0);
        const valuation = totalUnits * Number(p.costPrice);
        const retailValuation = totalUnits * Number(p.sellingPrice);
        let status = 'In Stock';
        if (totalUnits === 0) status = 'Out of Stock';
        else if (totalUnits <= p.minStockLevel) status = 'Low Stock';

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          category: p.category.name,
          supplier: p.defaultSupplier?.companyName || 'N/A',
          unit: p.unit,
          costPrice: Number(p.costPrice),
          sellingPrice: Number(p.sellingPrice),
          totalStock: totalUnits,
          minStockLevel: p.minStockLevel,
          totalValuation: Number(valuation.toFixed(2)),
          potentialRevenue: Number(retailValuation.toFixed(2)),
          status,
        };
      })
      .filter((item) => {
        if (filter === 'low_stock') return item.status === 'Low Stock';
        if (filter === 'out_of_stock') return item.status === 'Out of Stock';
        return true;
      });

    return res.json({ success: true, data: report });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const exportReportCSV = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        defaultSupplier: true,
        inventories: true,
      },
    });

    const headers = [
      'Product Name',
      'SKU',
      'Barcode',
      'Category',
      'Supplier',
      'Cost Price',
      'Selling Price',
      'Current Stock',
      'Min Stock Level',
      'Total Value',
      'Status',
    ];

    const rows = products.map((p) => {
      const units = p.inventories.reduce((sum, inv) => sum + inv.quantity, 0);
      const val = (units * Number(p.costPrice)).toFixed(2);
      let status = 'In Stock';
      if (units === 0) status = 'Out of Stock';
      else if (units <= p.minStockLevel) status = 'Low Stock';

      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.sku}"`,
        `"${p.barcode || ''}"`,
        `"${p.category.name}"`,
        `"${p.defaultSupplier?.companyName || 'N/A'}"`,
        p.costPrice.toString(),
        p.sellingPrice.toString(),
        units,
        p.minStockLevel,
        val,
        status,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=wms-inventory-report-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
