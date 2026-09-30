import { GoogleGenAI, ThinkingLevel } from "@google/genai";

/** Gemini client. Server-side only: the key is read from env and never sent to the browser. */
export const gemini = {
  key: process.env.GEMINI_API_KEY ?? "",
  model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
};

export const geminiConfigured = () => Boolean(gemini.key);

let client: GoogleGenAI | null = null;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: gemini.key }));

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Streams the reply as plain-text chunks. */
export async function* geminiChat(system: string, turns: ChatTurn[], signal?: AbortSignal): AsyncGenerator<string> {
  const stream = await getClient().models.generateContentStream({
    model: gemini.model,
    // Gemini calls the assistant role "model".
    contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
    config: {
      systemInstruction: system,
      maxOutputTokens: 1024,
      // Minimal thinking keeps replies quick; the persona asks for short answers anyway.
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      abortSignal: signal,
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
