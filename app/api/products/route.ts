import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { jwtVerify } from "jose";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-super-secret-key-change-me"
);

// Helper to get businessId from JWT cookie
async function getBusinessId(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.businessId as string) || null;
  } catch {
    return null;
  }
}

// 1. GET ALL PRODUCTS FOR BUSINESS
export async function GET(request: Request) {
  try {
    const businessId = await getBusinessId(request);
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("GET Products Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 2. CREATE A NEW PRODUCT
export async function POST(request: Request) {
  try {
    const businessId = await getBusinessId(request);
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, price, stock, category } = await request.json();

    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Missing required fields (name, price, stock)" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category || "General",
        businessId,
      },
    });

    return NextResponse.json({ message: "Product created", product }, { status: 201 });
  } catch (error) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}