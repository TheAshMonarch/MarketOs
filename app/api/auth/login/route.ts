import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-super-secret-key-change-me"
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user and their business details in one query
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate stateless JWT payload
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business?.id || null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Prepare clean user data response
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      business: user.business
        ? {
            id: user.business.id,
            businessName: user.business.businessName,
            market: user.business.market,
          }
        : null,
    };

    const response = NextResponse.json(
      { message: "Login successful", user: userData },
      { status: 200 }
    );

    // Set JWT cookie (secure, HTTP-only, cross-site scripting protected)
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}