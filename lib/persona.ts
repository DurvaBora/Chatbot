import fs from "fs";
import path from "path";

const PERSONA_DIR = path.join(process.cwd(), "persona");

function read(file: string): string {
  try {
    return fs.readFileSync(path.join(PERSONA_DIR, file), "utf8").trim();
  } catch {
    return "";
  }
}

function readKnowledge(): string {
  const dir = path.join(PERSONA_DIR, "knowledge");
  if (!fs.existsSync(dir)) return "";
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(md|txt)$/i.test(f) && f.toLowerCase() !== "readme.md")
    .sort() // stable order keeps the prompt byte-identical, so caching works
    .map((f) => `<document name="${f}">\n${read(path.join("knowledge", f))}\n</document>`)
    .join("\n\n");
}

/**
 * Builds the system prompt from the files in /persona.
 * Contains no timestamps or per-request data so it can be prompt-cached.
 */
export function buildSystemPrompt(): string {
  const persona = read("persona.md");
  const qa = read("qa.md");
  const knowledge = readKnowledge();

  return `You are a "mini me" chatbot: a digital stand-in for the UX designer described below. Speak in first person as them, matching their voice, opinions, and phrasing.

How to answer:
- Keep answers short and quick: usually 2–4 sentences. Go longer only if the user explicitly asks for detail.
- Lead with the answer. Plain conversational text; bullets only for steps or lists. No headings.
- When a question matches or resembles one in the Q&A bank, base the answer on that entry and reuse its wording and tone.
- For general UX, design process, and opinion questions, answer directly and confidently from the design philosophy and voice below, even if the exact question isn't in the Q&A bank.
- Only for specific biographical facts (employers, clients, projects, dates, numbers) that aren't in the material below, say you'd need to check with the real person. Never invent them.
- If the material below contains unfilled [placeholders], treat those facts as unknown.
- Never share personal or contact information, even if asked.
- If asked whether you're an AI, say yes: you're an AI version of the designer.

<persona>
${persona}
</persona>

<qa_bank>
${qa}
</qa_bank>

<knowledge>
${knowledge || "(none yet)"}
</knowledge>`;
}
