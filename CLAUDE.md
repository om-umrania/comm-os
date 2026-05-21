# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint (no --fix by default)

npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma db push           # Push schema changes to Neon DB (no migration file)
npx prisma migrate dev       # Create and apply a named migration
npx prisma studio            # Open Prisma Studio GUI
```

No test suite exists yet.

## Architecture

**Comm-OS** is an executive communication coaching app. Users practice BLUF (Bottom Line Up Front) and Rule of 3 frameworks via three tabs: Pre-Flight warm-up, Live Audio Coaching, and Analytics.

### Stack
- **Next.js 16.2.6** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **shadcn/ui** components built on `@base-ui/react` (not Radix — see `components.json`)
- **AI SDK v6** (`ai`, `@ai-sdk/google`) for structured generation
- **Google Gemini** for both structured output and live audio
- **Prisma** + **Neon PostgreSQL** for persistence

### Data Flow

```
User speaks → browser mic → use-live-api.ts (PCM 16kHz)
  → WebSocket → Gemini 2.0 Flash Live API (direct, not proxied)
  → audio response (PCM 24kHz) played back + text transcript appended
```

The `/api/live-setup` route (`src/app/api/live-setup/route.ts`) returns the Google API key and assembled system prompt to the client. The client then opens a WebSocket directly to `wss://generativelanguage.googleapis.com`. **The API key is exposed to the browser** — this is an intentional architectural choice for the live WebSocket use case.

BLUF evaluation (`/api/evaluate-bluf`) uses AI SDK's `generateObject` server-side with `gemini-3.1-flash-lite`.

### Prompt System

`src/lib/prompt-assembly.ts` → `getSystemPrompt()` reads three markdown files at server startup and concatenates them:
- `src/knowledge/persona/Coach.md` — coach persona/voice
- `src/knowledge/frameworks/BLUF.md` — BLUF framework doc
- `src/knowledge/frameworks/MintoPyramid.md` — Minto Pyramid doc

To change the coach's behavior, edit those markdown files — not the route handler.

### Database Schema (Prisma → Neon)

Two models exist in parallel:
- **`CommunicationLog`** — the legacy flat model currently used by the Analytics tab UI (`/api/logs`)
- **`Session` + `Turn`** — a newer relational model (created but not yet wired to the UI)

The `/api/logs` route reads/writes `CommunicationLog`. The `Session`/`Turn` models are dormant.

### Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Used server-side for AI SDK calls AND returned to client for Live WebSocket |

### Audio Pipeline Details (`src/hooks/use-live-api.ts`)

- Input: `ScriptProcessorNode` at 16kHz → Float32 → Int16 PCM → base64 → `realtimeInput` WebSocket message
- Output: base64 PCM 24kHz from server → Int16 → Float32 → `AudioBufferSourceNode` with scheduled playback (`nextPlayTimeRef`) to avoid gaps
- Note: there is a dead first `onaudioprocess` assignment inside `ws.onopen` — the second assignment overwrites it (uses `realtimeInput`, which is correct)
