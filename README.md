# Durva — Ask me

An AI "mini me" chatbot that answers UX questions in first person, briefly.

## Run locally

1. `cp .env.example .env.local` and paste your Gemini key into `GEMINI_API_KEY`.
2. `npm install`, then `npm run dev`
3. Open http://localhost:3000. Switch designs with the Canvas / Orb / Wall control at the top right.

Until `GEMINI_API_KEY` is set, the chat streams sample answers so you can preview the UI.

**Deploying to Vercel:** add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) under Project → Settings → Environment Variables.

## Make it sound like you

Everything about "you" lives in `persona/`:

| File | What it's for |
|---|---|
| `persona.md` | Identity, voice, design philosophy, boundaries |
| `qa.md` | Real questions with your real answers. This has the biggest effect on how it sounds |
| `knowledge/*.md` | Extra material: LinkedIn export, case studies, notes |
| `config.json` | Name, headline, and suggested questions shown in the UI |

Edit these files and refresh. No code changes needed.

## Where things are

- `lib/gemini.ts`: Gemini client (streaming, minimal thinking for speed)
- `app/api/chat/route.ts`: adds the persona, streams the reply, basic rate limit
- `components/variants/`: the three designs (Canvas, Orb, Wall)
- `lib/persona.ts`: builds the system prompt from `persona/`
