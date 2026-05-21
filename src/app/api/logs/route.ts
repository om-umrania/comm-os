import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createLogSchema = z.object({
  scenario: z.string().min(1).max(500),
  pressureLevel: z.number().int().min(1).max(5),
  blufScore: z.boolean(),
  ruleOf3Score: z.boolean(),
  frazzleTrigger: z.string().max(2000).optional(),
  idealRewrite: z.string().max(8000).optional(),
});

export async function GET() {
  try {
    const logs = await prisma.communicationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const parsed = createLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const log = await prisma.communicationLog.create({ data: parsed.data });
    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
