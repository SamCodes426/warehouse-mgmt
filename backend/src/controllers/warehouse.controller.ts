import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getWarehouses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: true,
        _count: {
          select: { inventories: true, users: true },
        },
        inventories: {
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = warehouses.map((wh) => {
      const currentStockUnits = wh.inventories.reduce((acc, curr) => acc + curr.quantity, 0);
      const utilization = wh.capacity > 0 ? Math.min(100, Math.round((currentStockUnits / wh.capacity) * 100)) : 0;

      return {
        id: wh.id,
        name: wh.name,
        code: wh.code,
        address: wh.address,
        city: wh.city,
        state: wh.state,
        managerName: wh.managerName,
        contactNumber: wh.contactNumber,
        capacity: wh.capacity,
        currentStockUnits,
        utilization,
        isActive: wh.isActive,
        locationsCount: wh.locations.length,
        locations: wh.locations,
        createdAt: wh.createdAt,
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWarehouseById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: true,
        inventories: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true, costPrice: true } },
            location: true,
          },
        },
      },
    });

    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const currentStockUnits = warehouse.inventories.reduce((acc, curr) => acc + curr.quantity, 0);
    const utilization = warehouse.capacity > 0 ? Math.round((currentStockUnits / warehouse.capacity) * 100) : 0;

    return res.json({
      success: true,
      data: {
        ...warehouse,
        currentStockUnits,
        utilization,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createWarehouse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, address, city, state, managerName, contactNumber, capacity } = req.body;

    const existing = await prisma.warehouse.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Warehouse with this code already exists' });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code: code.toUpperCase(),
        address,
        city,
        state,
        managerName,
        contactNumber,
        capacity: capacity || 10000,
      },
    });

    // Auto-create initial default Zones
    await prisma.warehouseLocation.createMany({
      data: [
        { warehouseId: warehouse.id, zone: 'Zone A', aisle: '01', rack: '01', shelf: '01', bin: 'A1', code: 'A-01-01-01-A1', capacity: 1000 },
        { warehouseId: warehouse.id, zone: 'Zone B', aisle: '01', rack: '01', shelf: '01', bin: 'B1', code: 'B-01-01-01-B1', capacity: 1000 },
      ],
    });

    return res.status(201).json({ success: true, message: 'Warehouse created successfully', data: warehouse });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWarehouse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.managerName !== undefined && { managerName: data.managerName }),
        ...(data.contactNumber !== undefined && { contactNumber: data.contactNumber }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return res.json({ success: true, message: 'Warehouse updated successfully', data: warehouse });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWarehouse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check inventory
    const totalInventory = await prisma.inventory.aggregate({
      where: { warehouseId: id },
      _sum: { quantity: true },
    });

    if ((totalInventory._sum.quantity || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse containing stock. Transfer or write off inventory first.',
      });
    }

    await prisma.warehouse.delete({ where: { id } });
    return res.json({ success: true, message: 'Warehouse deleted safely' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { warehouseId, zone, aisle, rack, shelf, bin, code, capacity } = req.body;

    const location = await prisma.warehouseLocation.create({
      data: {
        warehouseId,
        zone,
        aisle,
        rack,
        shelf,
        bin,
        code: code.toUpperCase(),
        capacity: capacity || 500,
      },
    });

    return res.status(201).json({ success: true, message: 'Location created successfully', data: location });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
