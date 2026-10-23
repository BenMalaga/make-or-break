import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import {
  type ChallengeMeta,
  type ChallengeDifficulty,
  type AnswerType,
  POINTS_BY_DIFFICULTY,
} from "./config";

/**
 * SERVER ONLY. Reads challenge content from content/challenges/<slug>.mdx. The
 * canonical answer lives in frontmatter and is checked here; it is never placed
 * in a ChallengeMeta (what the client receives). Adding a challenge is a content
 * edit, no database involved: solves live in the browser's progress store.
 */

const DIR = path.join(process.cwd(), "content", "challenges");

interface ChallengeFrontmatter {
  title: string;
  summary: string;
  track: "make" | "break";
  category: string;
  difficulty: ChallengeDifficulty;
  points?: number;
  tags?: string[];
  answer: string | number;
  answerType?: AnswerType;
  caseSensitive?: boolean;
  starterLang?: string;
  starter?: string;
  hints?: string[];
  daily?: boolean;
}

interface LoadedChallenge {
  meta: ChallengeMeta;
  body: string;
  // server-only fields
  answer: string;
  answerType: AnswerType;
  caseSensitive: boolean;
}

function load(file: string): LoadedChallenge | null {
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const fm = data as ChallengeFrontmatter;
  if (!fm.title || fm.answer === undefined || fm.answer === null) return null;
  const slug = path.basename(file).replace(/\.mdx$/, "");
  const difficulty = (fm.difficulty ?? "EASY") as ChallengeDifficulty;
  const answerType = (fm.answerType ?? "text") as AnswerType;
  const meta: ChallengeMeta = {
    slug,
    title: fm.title,
    summary: fm.summary ?? "",
    track: fm.track ?? "make",
    category: fm.category ?? "code",
    difficulty,
    points: fm.points ?? POINTS_BY_DIFFICULTY[difficulty],
    tags: fm.tags ?? [],
    answerType,
    starterLang: fm.starterLang,
    starter: fm.starter,
    hints: fm.hints ?? [],
    daily: fm.daily ?? false,
  };
  return {
    meta,
    body: content,
    answer: String(fm.answer),
    answerType,
    caseSensitive: fm.caseSensitive ?? false,
  };
}

function allFiles(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(DIR, f));
}

/** Every challenge's client-safe metadata (no answers, no body). */
export function listChallenges(): ChallengeMeta[] {
  return allFiles()
    .map((f) => load(f)?.meta)
    .filter((m): m is ChallengeMeta => Boolean(m));
}

/** One challenge with its description body (still no answer in the return). */
export function getChallenge(slug: string): { meta: ChallengeMeta; body: string } | null {
  const loaded = load(path.join(DIR, `${slug}.mdx`));
  if (!loaded) return null;
  return { meta: loaded.meta, body: loaded.body };
}

/** Normalize a value for comparison based on its answer type. */
function normalize(value: string, type: AnswerType, caseSensitive: boolean): string {
  const trimmed = value.trim();
  if (type === "flag") return trimmed; // flags are exact, case included
  if (type === "number") {
    const cleaned = trimmed.replace(/[,\s]/g, "");
    // Keep big integers exact by comparing digit strings without leading zeros.
    if (/^-?\d+$/.test(cleaned)) {
      const neg = cleaned.startsWith("-");
      const digits = cleaned.replace(/^-/, "").replace(/^0+(?=\d)/, "");
      return (neg && digits !== "0" ? "-" : "") + digits;
    }
    const n = Number(cleaned);
    return Number.isFinite(n) ? String(n) : cleaned;
  }
  // text
  const collapsed = trimmed.replace(/\s+/g, " ");
  return caseSensitive ? collapsed : collapsed.toLowerCase();
}

/**
 * Check a submitted answer against the canonical one, server-side. Returns null
 * if the challenge does not exist.
 */
export function checkAnswer(slug: string, submission: string): boolean | null {
  const loaded = load(path.join(DIR, `${slug}.mdx`));
  if (!loaded) return null;
  const expected = normalize(loaded.answer, loaded.answerType, loaded.caseSensitive);
  const got = normalize(submission, loaded.answerType, loaded.caseSensitive);
  return expected.length > 0 && expected === got;
}

/** Hash the normalized answer (used when authoring wants a stored hash instead of plaintext). */
export function hashAnswer(raw: string, answerType: AnswerType, caseSensitive: boolean): string {
  const norm = normalize(raw, answerType, caseSensitive);
  return crypto.createHash("sha256").update(norm).digest("hex");
}
