import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const logs = await prisma.communicationLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const log = await prisma.communicationLog.create({
      data: {
        scenario: body.scenario,
        pressureLevel: body.pressureLevel,
        blufScore: body.blufScore,
        ruleOf3Score: body.ruleOf3Score,
        frazzleTrigger: body.frazzleTrigger,
        idealRewrite: body.idealRewrite,
      }
    });
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
