import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";

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

// GET PASSPORT DETAILS & QR CODE
export async function GET(request: Request) {
  try {
    const businessId = await getBusinessId(request);
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch business and include the relation to the owner/user
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business passport not found" }, { status: 404 });
    }

    // Create a payload to encode in the QR code using your actual fields
    const qrPayload = JSON.stringify({
      b_id: business.id,
      name: business.businessName,
      market: business.market,
      shop: business.shopNumber,
      owner: business.user?.name || "Trader",
    });

    const encodedPayload = encodeURIComponent(qrPayload);
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodedPayload}&choe=UTF-8`;

    return NextResponse.json(
      {
        passport: {
          id: business.id,
          businessName: business.businessName,
          market: business.market,
          shopNumber: business.shopNumber,
          category: business.category,
          description: business.description,
          reputation: business.reputation,
          ownerName: business.user?.name || "Trader",
          phone: business.user?.phone || null,
          qrCodeUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Passport GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}