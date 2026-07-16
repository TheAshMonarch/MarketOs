import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db"; // Clean singleton import!

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-super-secret-key-change-me"
);

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

// RECORD A NEW SALE (AND DEDUCT STOCK)
export async function POST(request: Request) {
  try {
    const businessId = await getBusinessId(request);
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity, paymentMethod } = await request.json();

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields (productId, quantity)" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.businessId !== businessId) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Only ${product.stock} units left.`);
      }

      const totalAmount = product.price * quantity;

      const sale = await tx.sale.create({
        data: {
          productId,
          quantity: parseInt(quantity),
          amount: totalAmount,
          paymentMethod: paymentMethod || "CASH",
          businessId,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: product.stock - quantity,
        },
      });

      return sale;
    });

    return NextResponse.json({ message: "Sale recorded successfully", sale: result }, { status: 201 });
  } catch (error: any) {
    console.error("POST Sale Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}