import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const MAX_TEXT_LENGTH = 2000;

const requestSchema = z.object({
  rawThought: z.string().min(1, 'rawThought is required').max(MAX_TEXT_LENGTH),
  scenario: z.string().min(1, 'scenario is required').max(500),
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { rawThought, scenario } = parsed.data;

    const result = await generateObject({
      model: google('gemini-2.0-flash-lite'),
      schema: z.object({
        blufRewrite: z.string().describe('The restructured thought leading with the conclusion (BLUF).'),
        supportingPoints: z.array(z.string()).max(3).describe('Up to 3 categorized supporting themes (Rule of 3).'),
        critique: z.string().describe('A 1-sentence explanation of what was cut from the original thought and why.'),
      }),
      system: `You are an executive communication coach for a high-performing professional preparing for a rigorous business environment.
Your goal is to strip away excessive context and apply the BLUF (Bottom Line Up Front) and Rule of 3 frameworks.
Never use jargon. Be ruthless in cutting the "journey of discovery" and deliver only the destination.`,
      prompt: `Scenario: ${scenario}\nRaw Frazzled Thought: ${rawThought}`,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Error in BLUF Engine:', error);
    return Response.json({ error: 'Failed to generate BLUF rewrite' }, { status: 500 });
  }
}
