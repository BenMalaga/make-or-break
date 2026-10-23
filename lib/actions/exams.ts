"use server";

import { listCerts, type LoadedCert, type QuestionDef } from "@/lib/content/certs";

export type ExamMode = "practice" | "timed" | "domain";

export interface ClientQuestion {
  id: string;
  question: string;
  options: string[];
  multi: boolean;
  domain: string | null;
}

export interface SubmitExamInput {
  certSlug: string;
  mode: ExamMode;
  answers: { questionId: string; selected: number[] }[];
}

export interface QuestionResult {
  questionId: string;
  question: string;
  options: string[];
  correct: number[];
  selected: number[];
  isCorrect: boolean;
  explanation: string;
  domain: string | null;
}

export interface ExamResult {
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  passScore: number;
  domainBreakdown: { name: string; correct: number; total: number }[];
  questions: QuestionResult[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

interface IndexedQ {
  id: string;
  q: QuestionDef;
  /** Position of the question's domain in the cert's domain list (sorted by number). */
  pos: number;
  domainName: string | null;
}

/**
 * Stable question ids: `${certSlug}:${domainIndex}:${questionIndex}`. The
 * grading step rebuilds this exact mapping from the same content on disk, so
 * the ids only need to stay stable within one content deploy. Questions whose
 * domain number matches no declared domain land in a trailing unassigned
 * bucket with a null domain name (rendered as "General" in breakdowns).
 */
function indexQuestions(certSlug: string, loaded: LoadedCert): Map<string, IndexedQ> {
  const domains = [...loaded.cert.domains].sort((a, b) => a.number - b.number);
  const posByNumber = new Map(domains.map((d, i) => [d.number, i]));
  const buckets = new Map<number, QuestionDef[]>();
  for (const q of loaded.questions) {
    const pos = posByNumber.get(q.domain) ?? domains.length;
    const list = buckets.get(pos) ?? [];
    list.push(q);
    buckets.set(pos, list);
  }
  const map = new Map<string, IndexedQ>();
  for (const [pos, qs] of buckets) {
    const domainName = domains[pos]?.name ?? null;
    qs.forEach((q, i) => map.set(`${certSlug}:${pos}:${i}`, { id: `${certSlug}:${pos}:${i}`, q, pos, domainName }));
  }
  return map;
}

function toClient(entry: IndexedQ): ClientQuestion {
  return {
    id: entry.id,
    question: entry.q.question,
    options: entry.q.options,
    multi: entry.q.correct.length > 1,
    domain: entry.domainName,
  };
}

/**
 * Choose the question set for an exam run, straight from the content on disk.
 * `practice`/`timed` sample across the whole cert weighted by domain weight;
 * `domain` pulls from one domain. Correct answers and explanations are NOT
 * returned to the client (grading is server-side).
 */
export async function selectExamQuestions(opts: {
  certSlug: string;
  mode: ExamMode;
  count: number;
  domainNumber?: number;
}): Promise<ClientQuestion[]> {
  const { certSlug, mode, count, domainNumber } = opts;
  const loaded = listCerts().find((c) => c.cert.slug === certSlug);
  if (!loaded) return [];

  const domains = [...loaded.cert.domains].sort((a, b) => a.number - b.number);
  const posByNumber = new Map(domains.map((d, i) => [d.number, i]));
  const all = [...indexQuestions(certSlug, loaded).values()];

  if (mode === "domain" && domainNumber != null) {
    const pos = posByNumber.get(domainNumber);
    if (pos === undefined) return [];
    const pool = shuffle(all.filter((entry) => entry.pos === pos));
    return pool.slice(0, count).map(toClient);
  }

  const totalWeight = domains.reduce((s, d) => s + (d.weight || 0), 0) || 1;
  const chosen: IndexedQ[] = [];
  const picked = new Set<string>();
  for (const d of domains) {
    const pos = posByNumber.get(d.number) ?? -1;
    const pool = shuffle(all.filter((entry) => entry.pos === pos));
    const target = Math.round((count * (d.weight || 0)) / totalWeight);
    for (const entry of pool.slice(0, target)) {
      picked.add(entry.id);
      chosen.push(entry);
    }
  }
  if (chosen.length < count) {
    const rest = shuffle(all.filter((entry) => !picked.has(entry.id)));
    chosen.push(...rest.slice(0, count - chosen.length));
  }
  return shuffle(chosen)
    .slice(0, count)
    .map(toClient);
}

/** Grade a submitted exam server-side and return the review. Nothing is stored:
 * the client keeps its attempt history in the local progress store. */
export async function submitExam(input: SubmitExamInput): Promise<ExamResult> {
  const loaded = listCerts().find((c) => c.cert.slug === input.certSlug);
  if (!loaded) throw new Error("Unknown certification.");
  const byId = indexQuestions(input.certSlug, loaded);

  // Dedup by questionId so a repeated id cannot inflate the score.
  const seen = new Set<string>();
  const answers = input.answers.filter((a) => {
    if (seen.has(a.questionId)) return false;
    seen.add(a.questionId);
    return true;
  });

  const domainAgg = new Map<string, { correct: number; total: number }>();
  const results: QuestionResult[] = [];
  let correctCount = 0;
  let answeredValid = 0;

  for (const a of answers) {
    const entry = byId.get(a.questionId);
    if (!entry) continue;
    answeredValid++;
    const isCorrect = sameSet(a.selected, entry.q.correct);
    if (isCorrect) correctCount++;
    const dname = entry.domainName ?? "General";
    const agg = domainAgg.get(dname) ?? { correct: 0, total: 0 };
    agg.total++;
    if (isCorrect) agg.correct++;
    domainAgg.set(dname, agg);
    results.push({
      questionId: a.questionId,
      question: entry.q.question,
      options: entry.q.options,
      correct: entry.q.correct,
      selected: a.selected,
      isCorrect,
      explanation: entry.q.explanation,
      domain: entry.domainName,
    });
  }

  const passScore = loaded.cert.passScore ?? 75;

  // Score against a content-derived denominator. A cert-granting (timed) run
  // is graded over the full question count the run serves (the official count,
  // capped by the bank size), so unanswered questions count as wrong. A
  // practice run is graded over what was actually answered.
  const total =
    input.mode === "timed"
      ? Math.min(loaded.cert.questionCount, byId.size)
      : answeredValid;
  const score = total ? Math.round((correctCount / total) * 100) : 0;
  const passed = score >= passScore;
  const domainBreakdown = [...domainAgg.entries()].map(([name, v]) => ({ name, ...v }));

  return {
    score,
    correctCount,
    totalCount: total,
    passed,
    passScore,
    domainBreakdown,
    questions: results,
  };
}
