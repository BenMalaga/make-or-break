import { prisma } from "@/lib/db";

export type ExamMode = "practice" | "timed" | "domain";

export interface ClientQuestion {
  id: string;
  question: string;
  options: string[];
  multi: boolean;
  domain: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type QRow = {
  id: string;
  question: string;
  options: string[];
  correct: number[];
  domainId: string | null;
  domain: { name: string } | null;
};

function toClient(q: QRow): ClientQuestion {
  return {
    id: q.id,
    question: q.question,
    options: q.options,
    multi: q.correct.length > 1,
    domain: q.domain?.name ?? null,
  };
}

/**
 * Choose the question set for an exam run. `practice`/`timed` sample across the
 * whole cert weighted by domain weight; `domain` pulls from one domain.
 * Correct answers are NOT returned to the client (grading is server-side).
 */
export async function selectExamQuestions(opts: {
  certificationId: string;
  mode: ExamMode;
  count: number;
  domainNumber?: number;
}): Promise<ClientQuestion[]> {
  const { certificationId, mode, count, domainNumber } = opts;

  if (mode === "domain" && domainNumber != null) {
    const domain = await prisma.examDomain.findUnique({
      where: { certificationId_number: { certificationId, number: domainNumber } },
    });
    if (!domain) return [];
    const qs = await prisma.examQuestion.findMany({
      where: { certificationId, domainId: domain.id },
      include: { domain: { select: { name: true } } },
    });
    return shuffle(qs).slice(0, count).map(toClient);
  }

  const [domains, all] = await Promise.all([
    prisma.examDomain.findMany({ where: { certificationId } }),
    prisma.examQuestion.findMany({
      where: { certificationId },
      include: { domain: { select: { name: true } } },
    }),
  ]);

  const byDomain = new Map<string, QRow[]>();
  for (const q of all) {
    const key = q.domainId ?? "none";
    const list = byDomain.get(key) ?? [];
    list.push(q);
    byDomain.set(key, list);
  }

  const totalWeight = domains.reduce((s, d) => s + d.weight, 0) || 1;
  const chosen: QRow[] = [];
  for (const d of domains) {
    const pool = shuffle(byDomain.get(d.id) ?? []);
    const target = Math.round((count * d.weight) / totalWeight);
    chosen.push(...pool.slice(0, target));
  }
  if (chosen.length < count) {
    const have = new Set(chosen.map((q) => q.id));
    chosen.push(...shuffle(all.filter((q) => !have.has(q.id))).slice(0, count - chosen.length));
  }
  return shuffle(chosen).slice(0, count).map(toClient);
}
