// app/api/parseDirect/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const SYSTEM_INSTRUCTIONS = `
You are a resume parser. Read the resume PDF and normalize into JSON.
- Extract clean Education and Experience sections.
- Merge stray month lines into jobs.
- Normalize dates like "Jan 2024 – May 2024".
- Split bullets into summary_bullets arrays.
- Do NOT invent information.
Return JSON only, matching schema.
`;

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  required: ["experience", "education"],
  properties: {
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["company", "role", "dates"],
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          dates: { type: SchemaType.STRING },
          summary_bullets: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
      }
    },
    education: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  }
};

export async function POST(req: NextRequest) {
  try {
    const { resume_url } = await req.json();
    if (!resume_url) {
      return NextResponse.json({ error: "Missing resume_url" }, { status: 400 });
    }

    // Download the PDF
    const resp = await fetch(resume_url);
    if (!resp.ok) {
      throw new Error("Failed to fetch resume PDF");
    }
    const buffer = Buffer.from(await resp.arrayBuffer());

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMENI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTIONS,
    });

    // Send PDF as inlineData
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: buffer.toString("base64"),
                mimeType: "application/pdf",
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = result.response.text();
    const normalized = JSON.parse(jsonText);

    console.log("GEMINI PARSING RETURNED", normalized)

    return NextResponse.json({ success: true, data: normalized });
  } catch (err: unknown) {
    console.error("Direct Gemini parsing error:", err);
    return NextResponse.json(
      { error: "Parsing failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
