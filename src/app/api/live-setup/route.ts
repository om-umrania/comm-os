import { NextResponse } from 'next/server';
import { getSystemPrompt } from '@/lib/prompt-assembly';

export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const systemInstruction = getSystemPrompt();

  return NextResponse.json({
    apiKey,
    systemInstruction
  });
}
