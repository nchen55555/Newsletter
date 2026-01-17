import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    if (!notes || notes.length === 0) {
      return NextResponse.json(
        { error: 'No notes provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMENI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are analyzing notes that people have written about a professional in their network. These notes describe their relationship, the person's strengths, characteristics, and what they're known for.

Here are the notes from ${notes.length} different connections:

${notes.map((note: string, idx: number) => `${idx + 1}. ${note}`).join('\n\n')}

Based on these notes, write a specific analysis on what other people have characterized their relationship and reputation with this individual. Focus 
on the specific trends and patterns that have emerged in the notes. 

No preamble or markedown. Limit to 2-5 sentences.
    `.trim();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating reputation summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
