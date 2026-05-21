import fs from 'fs';
import path from 'path';

export function getSystemPrompt(): string {
  try {
    const kbRoot = path.join(process.cwd(), 'src', 'knowledge');
    
    const readMd = (relPath: string) => {
      try {
        return fs.readFileSync(path.join(kbRoot, relPath), 'utf-8');
      } catch {
        console.warn(`Could not read ${relPath}`);
        return '';
      }
    };

    const coachPersona = readMd('persona/Coach.md');
    const blufFramework = readMd('frameworks/BLUF.md');
    const mintoFramework = readMd('frameworks/MintoPyramid.md');

    return `
You are the Strategic Communication Coach.

${coachPersona}

---
KNOWLEDGE BASE:

${blufFramework}

${mintoFramework}

---
STRICT RULES:
1. Always evaluate the user's input against the BLUF and Rule of 3 frameworks.
2. Provide a 1-2 sentence critique of their acoustic/structural delivery (e.g., "You rushed the intro," "You hid the BLUF at the end").
3. Provide an ideal 60-second executive rewrite of what they just said.
4. Keep your responses crisp and audio-friendly.
`.trim();

  } catch (error) {
    console.error('Error assembling system prompt:', error);
    return 'You are an executive communication coach. Train the user to use BLUF and the Rule of 3.';
  }
}
