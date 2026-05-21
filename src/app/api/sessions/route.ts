import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const turnSchema = z.object({
  speaker: z.enum(['user', 'ai']),
  transcript: z.string().min(1).max(10000),
  blufScore: z.boolean().optional(),
  ruleOf3Score: z.boolean().optional(),
  critique: z.string().max(2000).optional(),
  wordCount: z.number().int().min(0).optional(),
});

const createSessionSchema = z.object({
  scenario: z.string().max(500).optional(),
  pressureLevel: z.number().int().min(1).max(5).optional(),
  duration: z.number().int().min(0).optional(),
  blufAccuracy: z.number().min(0).max(1).optional(),
  rule3Accuracy: z.number().min(0).max(1).optional(),
  weekNumber: z.number().int().min(1).max(53).optional(),
  turns: z.array(turnSchema).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0);

  try {
    const [sessions, total] = await prisma.$transaction([
      prisma.session.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { turns: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.session.count(),
    ]);
    return NextResponse.json({ sessions, total, limit, offset });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { turns, ...sessionData } = parsed.data;

    const session = await prisma.session.create({
      data: {
        ...sessionData,
        turns: turns ? { create: turns } : undefined,
      },
      include: { turns: true },
    });

    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
