import { PrismaClient, Role, MovementType, POStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive WMS enterprise database seeding...');

  // Clean existing tables
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.warehouseLocation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();

  // 1. Create Warehouses
  console.log('📦 Creating Warehouses...');
  const whCentral = await prisma.warehouse.create({
    data: {
      name: 'Central Distribution Center',
      code: 'CDC-01',
      address: '742 Logistics Way, Suite 100',
      city: 'Chicago',
      state: 'IL',
      managerName: 'David Vance',
      contactNumber: '+1 (312) 555-0192',
      capacity: 50000,
    },
  });

  const whWest = await prisma.warehouse.create({
    data: {
      name: 'Pacific West Coast Hub',
      code: 'PWC-02',
      address: '1080 Harbor Blvd',
      city: 'Long Beach',
      state: 'CA',
      managerName: 'Elena Rostova',
      contactNumber: '+1 (562) 555-0844',
      capacity: 35000,
    },
  });

  const whTexas = await prisma.warehouse.create({
    data: {
      name: 'Lone Star Logistics Terminal',
      code: 'LSL-03',
      address: '4200 Freight Parkway',
      city: 'Dallas',
      state: 'TX',
      managerName: 'Marcus Sterling',
      contactNumber: '+1 (214) 555-7319',
      capacity: 40000,
    },
  });

  // Locations / Bins
  const locCentralA = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whCentral.id,
      zone: 'Zone A - High Density',
      aisle: 'A01',
      rack: 'R04',
      shelf: 'S02',
      bin: 'B01',
      code: 'CDC-A01-R04-S02-B01',
      capacity: 5000,
    },
  });

  const locCentralB = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whCentral.id,
      zone: 'Zone B - Rapid Picking',
      aisle: 'B02',
      rack: 'R01',
      shelf: 'S01',
      bin: 'B05',
      code: 'CDC-B02-R01-S01-B05',
      capacity: 2500,
    },
  });

  // 2. Create Users
  console.log('👤 Creating Users across Roles...');
  const salt = await bcrypt.genSalt(10);
  const passwordHashAdmin = await bcrypt.hash('admin123', salt);
  const passwordHashManager = await bcrypt.hash('manager123', salt);
  const passwordHashStaff = await bcrypt.hash('staff123', salt);
  const passwordHashViewer = await bcrypt.hash('viewer123', salt);

  const userAdmin = await prisma.user.create({
    data: {
      name: 'Alexander Cross',
      email: 'admin@warehouse.com',
      password: passwordHashAdmin,
      role: Role.ADMIN,
      phone: '+1 (555) 010-0001',
      warehouseId: whCentral.id,
    },
  });

  const userManager = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'manager@warehouse.com',
      password: passwordHashManager,
      role: Role.WAREHOUSE_MANAGER,
      phone: '+1 (555) 010-0002',
      warehouseId: whCentral.id,
    },
  });

  const userStaff = await prisma.user.create({
    data: {
      name: 'Robert Miller',
      email: 'staff@warehouse.com',
      password: passwordHashStaff,
      role: Role.INVENTORY_STAFF,
      phone: '+1 (555) 010-0003',
      warehouseId: whCentral.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Claire Beauchamp',
      email: 'viewer@warehouse.com',
      password: passwordHashViewer,
      role: Role.VIEWER,
      phone: '+1 (555) 010-0004',
      warehouseId: whWest.id,
    },
  });

  // 3. Create Categories
  console.log('🏷️ Creating Categories...');
  const catElectronics = await prisma.category.create({
    data: { name: 'Industrial Electronics', description: 'Sensors, microcontrollers, controllers & power modules' },
  });

  const catMachinery = await prisma.category.create({
    data: { name: 'Mechanical & Hydraulic', description: 'Valves, pumps, bearings, and heavy assembly components' },
  });

  const catSafety = await prisma.category.create({
    data: { name: 'Safety Equipment', description: 'PPE, safety helmets, hazard signage & protective barriers' },
  });

  const catPackaging = await prisma.category.create({
    data: { name: 'Packaging Materials', description: 'Heavy-duty corrugated boxes, pallet wraps & security seals' },
  });

  // 4. Create Suppliers
  console.log('🏭 Creating Suppliers...');
  const supApex = await prisma.supplier.create({
    data: {
      name: 'Richard Chen',
      companyName: 'Apex Industrial Dynamics',
      email: 'sales@apexindustrial.com',
      phone: '+1 (800) 492-8812',
      address: '920 Industrial Blvd, Detroit, MI',
      gstNumber: 'GSTIN-26AAACA1234A1Z5',
      contactPerson: 'Richard Chen (Lead Key Account)',
    },
  });

  const supGlobal = await prisma.supplier.create({
    data: {
      name: 'Jessica Vance',
      companyName: 'Global Micro Components Inc',
      email: 'orders@globalmicro.tech',
      phone: '+1 (888) 321-9941',
      address: '400 Silicon Expressway, San Jose, CA',
      gstNumber: 'GSTIN-06BBBCB5678B2Z1',
      contactPerson: 'Jessica Vance (VP Supply Chain)',
    },
  });

  const supTitan = await prisma.supplier.create({
    data: {
      name: 'Garth Hudson',
      companyName: 'Titan Heavy Alloys Ltd',
      email: 'contact@titanalloys.com',
      phone: '+1 (877) 654-2200',
      address: '1500 Foundry Road, Pittsburgh, PA',
      gstNumber: 'GSTIN-33CCCC9012C3Z7',
      contactPerson: 'Garth Hudson',
    },
  });

  // 5. Create Products & Inventory
  console.log('📦 Creating Products & Stocks...');
  const productsData = [
    {
      name: 'Digital Optical Proximity Sensor 24V',
      sku: 'SENS-OPT-001',
      barcode: '8901234567890',
      description: 'High-precision photoelectric proximity switch for automated conveyor sorters',
      categoryId: catElectronics.id,
      unit: 'pcs',
      costPrice: 42.5,
      sellingPrice: 78.0,
      minStockLevel: 25,
      supplierId: supGlobal.id,
      stockWh1: 140,
      stockWh2: 85,
    },
    {
      name: 'PLC Core Controller Unit 16 I/O',
      sku: 'PLC-CTRL-16X',
      barcode: '8901234567891',
      description: 'Modular programmable logic controller with Modbus TCP/IP support',
      categoryId: catElectronics.id,
      unit: 'pcs',
      costPrice: 285.0,
      sellingPrice: 450.0,
      minStockLevel: 10,
      supplierId: supGlobal.id,
      stockWh1: 32,
      stockWh2: 12,
    },
    {
      name: 'Heavy Duty Sealed Ball Bearing 6205-2RS',
      sku: 'BRG-6205-2RS',
      barcode: '8901234567892',
      description: 'Chrome steel dual rubber sealed deep groove ball bearing',
      categoryId: catMachinery.id,
      unit: 'pcs',
      costPrice: 6.2,
      sellingPrice: 14.5,
      minStockLevel: 50,
      supplierId: supApex.id,
      stockWh1: 420,
      stockWh2: 300,
    },
    {
      name: 'High Pressure Hydraulic Valve 350 Bar',
      sku: 'VLV-HYD-350',
      barcode: '8901234567893',
      description: 'Directional spool control valve with proportional solenoid actuation',
      categoryId: catMachinery.id,
      unit: 'pcs',
      costPrice: 195.0,
      sellingPrice: 320.0,
      minStockLevel: 15,
      supplierId: supTitan.id,
      stockWh1: 8, // Low Stock!
      stockWh2: 4,
    },
    {
      name: 'Class E Impact Safety Helmet with Visor',
      sku: 'PPE-HLM-090',
      barcode: '8901234567894',
      description: 'Vented ergonomic polycarbonate hard hat with integrated ratchet suspension',
      categoryId: catSafety.id,
      unit: 'pcs',
      costPrice: 18.0,
      sellingPrice: 34.0,
      minStockLevel: 30,
      supplierId: supApex.id,
      stockWh1: 180,
      stockWh2: 90,
    },
    {
      name: 'Grade 8.8 High-Tensile Steel Hex Bolts (Pack of 100)',
      sku: 'BLT-HT88-M12',
      barcode: '8901234567895',
      description: 'M12 x 50mm zinc plated structural hex head fasteners',
      categoryId: catMachinery.id,
      unit: 'pack',
      costPrice: 22.5,
      sellingPrice: 39.9,
      minStockLevel: 20,
      supplierId: supTitan.id,
      stockWh1: 0, // Out of Stock!
      stockWh2: 0,
    },
    {
      name: 'Industrial Stretch Film 80 Gauge 500m Roll',
      sku: 'PKG-STR-80G',
      barcode: '8901234567896',
      description: 'Cast puncture-resistant pallet wrapping cling film roll',
      categoryId: catPackaging.id,
      unit: 'roll',
      costPrice: 14.0,
      sellingPrice: 24.5,
      minStockLevel: 40,
      supplierId: supApex.id,
      stockWh1: 210,
      stockWh2: 150,
    },
    {
      name: 'Industrial Nitrile Grip Safety Gloves (Box of 50)',
      sku: 'PPE-GLV-NIT50',
      barcode: '8901234567897',
      description: 'Chemical & abrasion resistant micro-foam nitrile coated work gloves',
      categoryId: catSafety.id,
      unit: 'box',
      costPrice: 35.0,
      sellingPrice: 58.0,
      minStockLevel: 20,
      supplierId: supApex.id,
      stockWh1: 15, // Low stock!
      stockWh2: 2,
    },
  ];

  const createdProducts = [];
  for (const item of productsData) {
    const prod = await prisma.product.create({
      data: {
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        description: item.description,
        categoryId: item.categoryId,
        unit: item.unit,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        minStockLevel: item.minStockLevel,
        defaultSupplierId: item.supplierId,
      },
    });

    createdProducts.push(prod);

    // Stock in Central WH
    if (item.stockWh1 > 0) {
      await prisma.inventory.create({
        data: {
          productId: prod.id,
          warehouseId: whCentral.id,
          locationId: locCentralA.id,
          quantity: item.stockWh1,
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: prod.id,
          warehouseId: whCentral.id,
          type: MovementType.STOCK_IN,
          quantity: item.stockWh1,
          referenceNumber: `INB-${prod.sku}-001`,
          supplierId: item.supplierId,
          notes: 'Standard stock replenishment consignment',
          createdById: userStaff.id,
        },
      });
    }

    // Stock in West WH
    if (item.stockWh2 > 0) {
      await prisma.inventory.create({
        data: {
          productId: prod.id,
          warehouseId: whWest.id,
          quantity: item.stockWh2,
        },
      });
    }
  }

  // 6. Historical Movements for Analytics (Past months)
  console.log('📈 Creating Analytics Movements...');
  const pastMonths = [1, 2, 3, 4, 5];
  for (const m of pastMonths) {
    const date = new Date();
    date.setMonth(date.getMonth() - m);

    // Stock in
    await prisma.stockMovement.create({
      data: {
        productId: createdProducts[0].id,
        warehouseId: whCentral.id,
        type: MovementType.STOCK_IN,
        quantity: 120 + m * 20,
        referenceNumber: `REC-M0${m}`,
        createdAt: date,
        createdById: userManager.id,
      },
    });

    // Stock out
    await prisma.stockMovement.create({
      data: {
        productId: createdProducts[2].id,
        warehouseId: whCentral.id,
        type: MovementType.STOCK_OUT,
        quantity: 90 + m * 15,
        destination: 'Fulfillment Order Station 4',
        referenceNumber: `DISP-M0${m}`,
        createdAt: date,
        createdById: userStaff.id,
      },
    });
  }

  // 7. Purchase Orders
  console.log('📑 Creating Purchase Orders...');
  const po1 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2026-0042',
      supplierId: supGlobal.id,
      warehouseId: whCentral.id,
      status: POStatus.RECEIVED,
      subtotal: 5120.0,
      taxRate: 18.0,
      taxAmount: 921.6,
      totalAmount: 6041.6,
      notes: 'Quarterly sensor inventory restocking',
      expectedDate: new Date(),
      receivedDate: new Date(),
      createdById: userManager.id,
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            quantity: 80,
            receivedQuantity: 80,
            unitPrice: 42.5,
            totalPrice: 3400.0,
          },
          {
            productId: createdProducts[1].id,
            quantity: 6,
            receivedQuantity: 6,
            unitPrice: 285.0,
            totalPrice: 1710.0,
          },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2026-0089',
      supplierId: supApex.id,
      warehouseId: whCentral.id,
      status: POStatus.PENDING,
      subtotal: 1980.0,
      taxRate: 18.0,
      taxAmount: 356.4,
      totalAmount: 2336.4,
      notes: 'Urgent restocking for PPE helmets & gloves',
      expectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdById: userManager.id,
      items: {
        create: [
          {
            productId: createdProducts[4].id,
            quantity: 60,
            receivedQuantity: 0,
            unitPrice: 18.0,
            totalPrice: 1080.0,
          },
          {
            productId: createdProducts[7].id,
            quantity: 25,
            receivedQuantity: 0,
            unitPrice: 36.0,
            totalPrice: 900.0,
          },
        ],
      },
    },
  });

  // 8. Notifications
  console.log('🔔 Generating Notifications...');
  await prisma.notification.createMany({
    data: [
      {
        title: 'Critical Out of Stock Alert',
        message: 'Product "Grade 8.8 High-Tensile Steel Hex Bolts" (BLT-HT88-M12) has reached 0 units.',
        type: NotificationType.OUT_OF_STOCK,
        link: '/inventory?search=BLT-HT88-M12',
        isRead: false,
      },
      {
        title: 'Low Stock Threshold Warning',
        message: 'Hydraulic Valve 350 Bar (VLV-HYD-350) is below minimum stock level (12 units available).',
        type: NotificationType.LOW_STOCK,
        link: '/inventory?search=VLV-HYD-350',
        isRead: false,
      },
      {
        title: 'Pending Purchase Order Approval',
        message: 'Purchase Order #PO-2026-0089 from Apex Industrial Dynamics requires delivery check.',
        type: NotificationType.PENDING_PO,
        link: `/purchase-orders/${po2.id}`,
        isRead: false,
      },
    ],
  });

  console.log('✅ Enterprise WMS database seeding completed successfully!');
  console.log('\nDemo User Accounts:');
  console.log('---------------------------------------------------------');
  console.log('Role               Email                   Password');
  console.log('---------------------------------------------------------');
  console.log('ADMIN              admin@warehouse.com     admin123');
  console.log('WAREHOUSE_MANAGER  manager@warehouse.com   manager123');
  console.log('INVENTORY_STAFF    staff@warehouse.com     staff123');
  console.log('VIEWER             viewer@warehouse.com    viewer123');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
