import { NextResponse } from "next/server";
//  Add this single import instead:
import { prisma } from "@/lib/db";
import { jwtVerify } from "jose";



const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-super-secret-key-change-me"
);

export async function GET(request: Request) {
  try {
    // 1. Get the token from cookies to verify the user
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Decode the JWT to get the trader's businessId
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const businessId = payload.businessId as string;

    if (!businessId) {
      return NextResponse.json(
        { error: "No business passport found linked to this account" },
        { status: 400 }
      );
    }

    // 3. Fetch sales history for this business
    const sales = await prisma.sale.findMany({
      where: { businessId },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    });

    if (sales.length === 0) {
      return NextResponse.json(
        {
          message: "No sales recorded yet.",
          analytics: {
            chartData: [],
            totalRevenue: 0,
            topProduct: "None",
            advisorTip: "Record your first sale to generate AI insights!",
          },
        },
        { status: 200 }
      );
    }

    // 4. Format database records into a clean summary for the LLM
    const salesSummary = sales.map((sale) => ({
      date: sale.createdAt.toISOString().split("T")[0],
      product: sale.product.name,
      quantity: sale.quantity,
      amount: sale.amount,
    }));

    // 5. Query the Gemini API using native fetch
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing on the server" },
        { status: 500 }
      );
    }

    const prompt = `
      You are an elite financial advisor for micro-traders in emerging markets.
      Analyze the following sales history:
      ${JSON.stringify(salesSummary, null, 2)}

      Based on this data, output a JSON object matching this schema:
      {
        "chartData": [
          { "date": "YYYY-MM-DD", "revenue": number }
        ],
        "totalRevenue": number,
        "topProduct": "string",
        "advisorTip": "A highly actionable, one-sentence business tip tailored to their sales trend (e.g., advising on stock, price points, or payment methods)."
      }

      Aggregate the revenues properly by date so the chart flows sequentially.
      Keep your "advisorTip" extremely practical and friendly, like a supportive peer.
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json", // Force JSON output mode!
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini error details:", errorText);
      throw new Error("Failed to fetch analysis from Gemini API");
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty response from AI engine");
    }

    // 6. Parse the forced-JSON response from Gemini
    const analytics = JSON.parse(rawText);

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error: any) {
    console.error("AI Insights Endpoint Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}