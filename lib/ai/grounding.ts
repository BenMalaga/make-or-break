import { ALL_TERMS } from "@/lib/glossary";

/**
 * Grounds the copilot in the platform's own content. For a given question it
 * pulls the most relevant glossary definitions and folds them, plus whatever the
 * learner is doing, into a system prompt. So "what is a port?" is answered from
 * our material, and a Build question sees the code and terminal output.
 */

const STOP = new Set([
  "what", "is", "a", "an", "the", "how", "do", "does", "did", "i", "my", "why",
  "in", "of", "to", "and", "for", "with", "this", "that", "it", "on", "can",
  "you", "me", "not", "code", "help", "am", "are", "when", "where", "which",
]);

export function relevantGlossary(question: string, max = 5) {
  const kws = (question.toLowerCase().match(/[a-z0-9+#-]{2,}/g) ?? []).filter((w) => !STOP.has(w));
  if (!kws.length) return [];
  const scored = ALL_TERMS.map((t) => {
    const idWords = t.id.replace(/-/g, " ");
    const hay = `${t.term} ${idWords} ${t.definition}`.toLowerCase();
    let score = 0;
    for (const kw of kws) {
      if (t.term.toLowerCase() === kw) score += 6;
      else if (idWords.includes(kw)) score += 3;
      else if (hay.includes(kw)) score += 1;
    }
    return { t, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
  return scored.map((s) => s.t);
}

export interface Grounding {
  question: string;
  page?: string;
  buildLang?: string;
  buildCode?: string;
  buildOutput?: string;
}

export function buildSystemPrompt(g: Grounding): string {
  const terms = relevantGlossary(g.question);
  const glossaryBlock = terms.length
    ? "Definitions from the platform glossary (authoritative here, prefer them):\n" +
      terms.map((t) => `- ${t.term}: ${t.definition}`).join("\n")
    : "";

  const ctx: string[] = [];
  if (g.page) ctx.push(`The learner is on the ${g.page} page.`);
  if (g.buildCode) {
    ctx.push(
      `They are writing ${g.buildLang || "code"} in the Build tab:\n\`\`\`\n${g.buildCode.slice(0, 2000)}\n\`\`\``,
    );
  }
  if (g.buildOutput) {
    ctx.push(`The most recent terminal output:\n\`\`\`\n${g.buildOutput.slice(0, 1200)}\n\`\`\``);
  }

  return [
    "You are the Make or Break copilot, a concise, friendly tutor on a free open-source platform for learning to make things (code, apps, AI, hardware) and break things (cybersecurity and networking).",
    "Answer clearly and briefly, like a good teacher. Use short code blocks when they help. When the learner is debugging, point at the specific line or idea and explain the fix. Never invent facts; if you are unsure, say so.",
    "Do not use em dashes or emojis.",
    glossaryBlock,
    ctx.length ? `Context:\n${ctx.join("\n\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
