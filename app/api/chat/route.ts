import { buildSystemPrompt } from "@/lib/persona";
import { ApiError } from "@google/genai";
import { geminiChat, geminiConfigured } from "@/lib/gemini";

export const runtime = "nodejs";

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 20;

// Basic per-IP rate limit (in-memory; resets on server restart).
const RATE_LIMIT = 20; // requests
const RATE_WINDOW_MS = 60_000; // per minute
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitize(body: unknown): ChatMessage[] | null {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const clean = messages
    .filter(
      (m): m is ChatMessage =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  // Conversation must start with a user turn and end with one.
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== "user") return null;
  return clean;
}

const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" };

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (rateLimited(ip)) {
    return new Response("Too many questions in a minute. Wait a moment and ask again.", { status: 429 });
  }

  const messages = sanitize(await req.json().catch(() => null));
  if (!messages) return new Response("Invalid request.", { status: 400 });

  if (!geminiConfigured()) return demoResponse();

  const system = buildSystemPrompt();
  const upstream = new AbortController();
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of geminiChat(system, messages, upstream.signal)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        if (upstream.signal.aborted) return;
        console.error("Gemini error:", err);
        const status = err instanceof ApiError ? err.status : 0;
        const msg =
          status === 401 || status === 403 || (status === 400 && /api key/i.test(String(err)))
              ? "Gemini rejected the API key. Check GEMINI_API_KEY."
              : status === 404
                ? "Gemini couldn't find that model. Check GEMINI_MODEL."
                : status === 429
                  ? "The Gemini usage limit was reached. Try again in a minute."
                  : "The answer couldn't be generated. Send the question again.";
        controller.enqueue(encoder.encode(`\n\n_${msg}_`));
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      upstream.abort();
    },
  });

  return new Response(body, { headers: TEXT_HEADERS });
}

// Until Gemini is configured, stream a sample answer so the UI can be previewed.
const DEMO_REPLIES = [
  "For me it always starts with the problem, not the screen. I talk to a few users, map what's actually getting in their way, then sketch fast and test early. Pixels come last.",
  "Honestly, it depends on the user. I'd look at where people drop off first, then fix the biggest friction point before touching anything visual.",
  "I keep it light: five users, a realistic task, and me staying quiet while they think out loud. You learn more from one awkward pause than a whole survey.",
];

function demoResponse() {
  const text = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
  const words = text.split(/(?<= )/);
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      await new Promise((r) => setTimeout(r, 900));
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 45));
      }
      controller.close();
    },
  });
  return new Response(body, { headers: { ...TEXT_HEADERS, "X-Demo": "1" } });
}
