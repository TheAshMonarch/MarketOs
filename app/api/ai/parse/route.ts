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

export async function POST(request: Request) {
  try {
    const businessId = await getBusinessId(request);
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "No input text provided" }, { status: 400 });
    }

    // 1. Fetch current inventory products to give Gemini the correct database matching list
    const products = await prisma.product.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    // 2. Format the system prompt for matching
    const systemPrompt = `
      You are a smart inventory parser for market traders. Your job is to extract product quantities from messy natural language inputs and match them to existing inventory items.

      Available Products in Database:
      ${JSON.stringify(products, null, 2)}

      User Input: "${text}"

      Instructions:
      1. Identify each product mentioned and its parsed quantity.
      2. Match each product to the closest "id" from the Available Products list above.
      3. If a product mentioned does not match any existing database product, set "productId" to null (this allows the user to add it as a new product on the frontend).
      4. Output a JSON object matching this exact schema:
      {
        "items": [
          {
            "productId": "string or null",
            "matchedName": "string (the exact name from database OR the parsed name if new product)",
            "quantity": number
          }
        ]
      }
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is missing" }, { status: 500 });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini Parse Error:", errorText);
      throw new Error("Failed to parse text with Gemini");
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty response from AI parser");
    }

    const result = JSON.parse(rawText);
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Parse Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}