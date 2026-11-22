import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { purchaseOrders: true, products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: suppliers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: { select: { id: true, name: true, sku: true, unit: true, costPrice: true } },
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    return res.json({ success: true, data: supplier });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, companyName, email, phone, address, gstNumber, contactPerson } = req.body;

    const existing = await prisma.supplier.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Supplier with this email already exists' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        companyName,
        email,
        phone,
        address,
        gstNumber: gstNumber || null,
        contactPerson: contactPerson || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Supplier created successfully', data: supplier });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.companyName && { companyName: data.companyName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.address && { address: data.address }),
        ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return res.json({ success: true, message: 'Supplier updated successfully', data: supplier });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if supplier has linked purchase orders
    const count = await prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supplier with existing purchase order history. Deactivate them instead.',
      });
    }

    await prisma.supplier.delete({ where: { id } });
    return res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
