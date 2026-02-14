// Database seed script for Shop POS
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shoppos.com' },
    update: {},
    create: {
      email: 'admin@shoppos.com',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create cashier user
  const cashierPassword = await bcrypt.hash('cashier123', 12);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@shoppos.com' },
    update: {},
    create: {
      email: 'cashier@shoppos.com',
      passwordHash: cashierPassword,
      firstName: 'John',
      lastName: 'Cashier',
      role: Role.CASHIER,
    },
  });
  console.log('✅ Created cashier user:', cashier.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-beverages' },
      update: {},
      create: { id: 'cat-beverages', name: 'Beverages', color: '#3B82F6', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { id: 'cat-snacks' },
      update: {},
      create: { id: 'cat-snacks', name: 'Snacks', color: '#22C55E', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { id: 'cat-groceries' },
      update: {},
      create: { id: 'cat-groceries', name: 'Groceries', color: '#F59E0B', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { id: 'cat-household' },
      update: {},
      create: { id: 'cat-household', name: 'Household', color: '#8B5CF6', sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { id: 'cat-personal' },
      update: {},
      create: { id: 'cat-personal', name: 'Personal Care', color: '#EC4899', sortOrder: 5 },
    }),
  ]);
  console.log('✅ Created', categories.length, 'categories');

  // Create products
  const products = await Promise.all([
    // Beverages
    prisma.product.upsert({
      where: { sku: 'BEV-001' },
      update: {},
      create: {
        sku: 'BEV-001',
        name: 'Mineral Water 500ml',
        description: 'Pure drinking water',
        categoryId: 'cat-beverages',
        price: 1.50,
        costPrice: 0.80,
        stockQuantity: 100,
        minStock: 20,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BEV-002' },
      update: {},
      create: {
        sku: 'BEV-002',
        name: 'Cola Soda 350ml',
        description: 'Classic cola drink',
        categoryId: 'cat-beverages',
        price: 2.00,
        costPrice: 1.00,
        stockQuantity: 80,
        minStock: 15,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BEV-003' },
      update: {},
      create: {
        sku: 'BEV-003',
        name: 'Orange Juice 1L',
        description: 'Fresh orange juice',
        categoryId: 'cat-beverages',
        price: 4.50,
        costPrice: 2.50,
        stockQuantity: 40,
        minStock: 10,
      },
    }),
    // Snacks
    prisma.product.upsert({
      where: { sku: 'SNK-001' },
      update: {},
      create: {
        sku: 'SNK-001',
        name: 'Potato Chips Original',
        description: 'Crispy potato chips',
        categoryId: 'cat-snacks',
        price: 2.50,
        costPrice: 1.20,
        stockQuantity: 60,
        minStock: 15,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SNK-002' },
      update: {},
      create: {
        sku: 'SNK-002',
        name: 'Chocolate Bar',
        description: 'Milk chocolate 50g',
        categoryId: 'cat-snacks',
        price: 1.80,
        costPrice: 0.90,
        stockQuantity: 100,
        minStock: 25,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SNK-003' },
      update: {},
      create: {
        sku: 'SNK-003',
        name: 'Cookies Pack',
        description: 'Assorted cookies 200g',
        categoryId: 'cat-snacks',
        price: 3.50,
        costPrice: 1.80,
        stockQuantity: 45,
        minStock: 10,
      },
    }),
    // Groceries
    prisma.product.upsert({
      where: { sku: 'GRM-001' },
      update: {},
      create: {
        sku: 'GRM-001',
        name: 'Rice 5kg',
        description: 'Premium long grain rice',
        categoryId: 'cat-groceries',
        price: 12.00,
        costPrice: 8.00,
        stockQuantity: 30,
        minStock: 5,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'GRM-002' },
      update: {},
      create: {
        sku: 'GRM-002',
        name: 'Cooking Oil 1L',
        description: 'Pure vegetable oil',
        categoryId: 'cat-groceries',
        price: 5.50,
        costPrice: 3.50,
        stockQuantity: 50,
        minStock: 10,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'GRM-003' },
      update: {},
      create: {
        sku: 'GRM-003',
        name: 'Sugar 1kg',
        description: 'Refined white sugar',
        categoryId: 'cat-groceries',
        price: 2.00,
        costPrice: 1.20,
        stockQuantity: 60,
        minStock: 15,
      },
    }),
    // Household
    prisma.product.upsert({
      where: { sku: 'HHS-001' },
      update: {},
      create: {
        sku: 'HHS-001',
        name: 'Laundry Detergent 1kg',
        description: 'High efficiency detergent',
        categoryId: 'cat-household',
        price: 8.50,
        costPrice: 5.00,
        stockQuantity: 25,
        minStock: 5,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'HHS-002' },
      update: {},
      create: {
        sku: 'HHS-002',
        name: 'Dish Soap 500ml',
        description: 'Concentrated dish washing liquid',
        categoryId: 'cat-household',
        price: 3.00,
        costPrice: 1.50,
        stockQuantity: 40,
        minStock: 10,
      },
    }),
    // Personal Care
    prisma.product.upsert({
      where: { sku: 'PRC-001' },
      update: {},
      create: {
        sku: 'PRC-001',
        name: 'Toothpaste',
        description: 'Mint flavor 100g',
        categoryId: 'cat-personal',
        price: 4.00,
        costPrice: 2.00,
        stockQuantity: 50,
        minStock: 12,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRC-002' },
      update: {},
      create: {
        sku: 'PRC-002',
        name: 'Shampoo 400ml',
        description: 'Anti-dandruff shampoo',
        categoryId: 'cat-personal',
        price: 6.50,
        costPrice: 3.50,
        stockQuantity: 35,
        minStock: 8,
      },
    }),
  ]);
  console.log('✅ Created', products.length, 'products');

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { memberCode: 'MEM-001' },
      update: {},
      create: {
        memberCode: 'MEM-001',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@example.com',
        phone: '555-0101',
        loyaltyPoints: 150,
        totalSpent: 450.00,
        visitCount: 12,
      },
    }),
    prisma.customer.upsert({
      where: { memberCode: 'MEM-002' },
      update: {},
      create: {
        memberCode: 'MEM-002',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael@example.com',
        phone: '555-0102',
        loyaltyPoints: 80,
        totalSpent: 230.50,
        visitCount: 7,
      },
    }),
    prisma.customer.upsert({
      where: { memberCode: 'MEM-003' },
      update: {},
      create: {
        memberCode: 'MEM-003',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily@example.com',
        phone: '555-0103',
        loyaltyPoints: 220,
        totalSpent: 680.25,
        visitCount: 18,
      },
    }),
  ]);
  console.log('✅ Created', customers.length, 'customers');

  // Create system settings
  const settings = await Promise.all([
    prisma.setting.upsert({
      where: { key: 'tax_rate' },
      update: {},
      create: { key: 'tax_rate', value: '10', description: 'Tax rate percentage' },
    }),
    prisma.setting.upsert({
      where: { key: 'currency' },
      update: {},
      create: { key: 'currency', value: 'USD', description: 'Currency code' },
    }),
    prisma.setting.upsert({
      where: { key: 'receipt_footer' },
      update: {},
      create: { key: 'receipt_footer', value: 'Thank you for shopping with us!', description: 'Receipt footer message' },
    }),
  ]);
  console.log('✅ Created', settings.length, 'settings');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
