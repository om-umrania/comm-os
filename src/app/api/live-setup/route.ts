import { NextResponse } from 'next/server';
import { getSystemPrompt } from '@/lib/prompt-assembly';

// Comma-separated list of allowed origins, e.g. "https://comm-os.vercel.app,http://localhost:3000"
// If unset, the check is skipped (suitable for local dev).
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) ?? [];

export async function GET(req: Request) {
  if (ALLOWED_ORIGINS.length > 0) {
    const origin = req.headers.get('origin') ?? '';
    const referer = req.headers.get('referer') ?? '';
    const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  return NextResponse.json({ apiKey, systemInstruction: getSystemPrompt() });
}
