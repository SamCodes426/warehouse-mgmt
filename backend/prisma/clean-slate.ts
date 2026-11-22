import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging all demo orders, items, stock movements, and test logs...');

  // 1. Wipe all transactional and inventory data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.warehouseLocation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.category.deleteMany();

  console.log('✨ Clean slate ready. Initializing professional client defaults...');

  // 2. Create clean standard Categories for the client
  const defaultCategories = [
    { name: 'Electronics & Components', description: 'Sensors, microcontrollers, controllers & power modules' },
    { name: 'Hardware & Mechanical', description: 'Fasteners, valves, pumps, bearings, and heavy assembly components' },
    { name: 'Safety & PPE Equipment', description: 'Helmets, safety goggles, gloves & protective equipment' },
    { name: 'Packaging & Dispatch', description: 'Cartons, stretch films, strapping & packing supplies' },
    { name: 'Raw Materials', description: 'Primary structural alloys, sheet metals & polymers' },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.create({ data: cat });
  }

  // 3. Create Clean Primary Facility
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Distribution Center',
      code: 'MDC-01',
      address: 'Plot No. 12, Industrial Logistics Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      managerName: 'Operations Lead',
      contactNumber: '+91 98765 43210',
      capacity: 50000,
      locations: {
        create: [
          { zone: 'Zone A', aisle: '01', rack: '01', shelf: '01', bin: 'A1', code: 'A-01-01-01-A1', capacity: 2500 },
          { zone: 'Zone B', aisle: '01', rack: '01', shelf: '01', bin: 'B1', code: 'B-01-01-01-B1', capacity: 2500 },
        ],
      },
    },
  });

  // 4. Create Single Clean Client Administrator Account
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  await prisma.user.create({
    data: {
      name: 'Client Administrator',
      email: 'admin@warehouse.com',
      password: passwordHash,
      role: Role.ADMIN,
      phone: '+91 98765 43210',
      warehouseId: mainWarehouse.id,
    },
  });

  console.log('✅ Client-ready clean slate completed!');
  console.log('   - 0 Demo Products');
  console.log('   - 0 Demo Orders');
  console.log('   - 0 Demo Movements');
  console.log('   - 5 Standard Product Categories ready');
  console.log('   - 1 Configured Primary Facility (Main Distribution Center)');
  console.log('   - 1 Clean Super Admin account (admin@warehouse.com / admin123)');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
