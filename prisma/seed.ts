import { PrismaClient, Role, PaymentMethod, TransactionStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import "dotenv/config"; // Ensure env variables are loaded in seed runner

// 1. Create a pg pool using the direct URL
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Instantiate Prisma Client using the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean up existing data to ensure a fresh, predictable state
  await prisma.review.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create the Single Demo Trader
  const hashedPassword = await bcrypt.hash("password123", 10);
  const demoUser = await prisma.user.create({
    data: {
      name: "Mama Amina",
      email: "amina@marketos.com",
      password: hashedPassword,
      phone: "+254712345678",
      role: Role.TRADER,
    },
  });

  // 3. Create Mama Amina's Market Passport
  const demoBusiness = await prisma.business.create({
    data: {
      userId: demoUser.id,
      businessName: "Amina Provisions Store",
      market: "Kejetia Market",
      shopNumber: "B-42",
      description: "Wholesale and retail distributor of premium grains, cooking oils, and household provisions.",
      category: "Provisions",
      reputation: 4.8,
      qrCode: "marketos://passport/amina-provisions-store",
    },
  });

  // 4. Create Core Inventory Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        businessId: demoBusiness.id,
        name: "5L Vegetable Cooking Oil",
        price: 180.0, // e.g., in local units (GHS/KES)
        stock: 12,  // Low stock warning trigger
        category: "Provisions",
      },
    }),
    prisma.product.create({
      data: {
        businessId: demoBusiness.id,
        name: "25kg Premium Jasmine Rice",
        price: 320.0,
        stock: 45,
        category: "Grains",
      },
    }),
    prisma.product.create({
      data: {
        businessId: demoBusiness.id,
        name: "Box of Spaghetti (40pcs)",
        price: 110.0,
        stock: 4,   // Critical stock alert
        category: "Provisions",
      },
    }),
    prisma.product.create({
      data: {
        businessId: demoBusiness.id,
        name: "1kg Refined White Sugar",
        price: 45.0,
        stock: 80,
        category: "Provisions",
      },
    }),
  ]);

  // Map products for easier referencing during sales generation
  const [cookingOil, jasmineRice, spaghetti, sugar] = products;

  // 5. Generate Historical Sales & Accompanying Verified Receipts
  // We'll generate a spread of realistic sales across the last few days
  const salesHistory = [
    {
      product: jasmineRice,
      qty: 2,
      method: PaymentMethod.MOBILE_MONEY,
      daysAgo: 4,
      buyer: "Kofi Mensah",
    },
    {
      product: sugar,
      qty: 5,
      method: PaymentMethod.CASH,
      daysAgo: 3,
      buyer: "Ama Serwaa",
    },
    {
      product: cookingOil,
      qty: 1,
      method: PaymentMethod.MOBILE_MONEY,
      daysAgo: 2,
      buyer: "Abena Osei",
    },
    {
      product: spaghetti,
      qty: 2,
      method: PaymentMethod.TRANSFER,
      daysAgo: 1,
      buyer: "Kwame Boateng",
    },
    {
      product: jasmineRice,
      qty: 1,
      method: PaymentMethod.CASH,
      daysAgo: 0, // Today
      buyer: "Yaa Konadu",
    },
  ];

  for (const [index, item] of salesHistory.entries()) {
    const totalAmount = item.product.price * item.qty;
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - item.daysAgo);

    // Create a transaction receipt first
    const transaction = await prisma.transaction.create({
      data: {
        businessId: demoBusiness.id,
        amount: totalAmount,
        status: TransactionStatus.SUCCESSFUL,
        receiptId: `REC-${1000 + index}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: saleDate,
      },
    });

    // Link the recorded sale to the transaction receipt
    await prisma.sale.create({
      data: {
        businessId: demoBusiness.id,
        productId: item.product.id,
        quantity: item.qty,
        amount: totalAmount,
        paymentMethod: item.method,
        customerName: item.buyer,
        transactionId: transaction.id,
        createdAt: saleDate,
      },
    });
  }

  // 6. Create a Baseline Customer Review
  await prisma.review.create({
    data: {
      businessId: demoBusiness.id,
      rating: 5,
      comment: "Always reliable and accepts Mobile Money smoothly. Receipts make tracking easy!",
      customer: "Kofi Mensah",
    },
  });

  console.log("Database successfully seeded!");
  console.log(`
  Trader Login Credentials:
  -------------------------
  Email:    amina@marketos.com
  Password: password123
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });