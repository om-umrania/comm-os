import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { rawThought, scenario } = await req.json();

    const result = await generateObject({
      model: google('gemini-3.1-flash-lite'),
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

    return result.toJsonResponse();
  } catch (error) {
    console.error('Error in BLUF Engine:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate BLUF' }), { status: 500 });
  }
}
