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

Based on these notes, write exactly 2 concise sentences that summarize how people describe this person. Focus on:
- Common themes across multiple notes
- Key strengths and characteristics
- What they're known for professionally
- Their reputation and how they're perceived

The summary should be professional, positive, and capture the essence of their professional reputation.

Return ONLY the 2 sentences. No additional text, no preamble, no markdown.
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
