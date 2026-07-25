"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { recordActivity } from "@/lib/gamification/apply";
import { evaluateAchievements } from "@/lib/gamification/evaluate";

export interface SubmitExamInput {
  certificationId: string;
  mode: string;
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
  attemptId: string;
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/** Grade a submitted exam server-side, record the attempt, and return the review. */
export async function submitExam(input: SubmitExamInput): Promise<ExamResult> {
  const user = await requireUser();

  // Dedup by questionId so a repeated id cannot inflate the score, and grade
  // only against questions that actually belong to this certification.
  const seen = new Set<string>();
  const answers = input.answers.filter((a) => {
    if (seen.has(a.questionId)) return false;
    seen.add(a.questionId);
    return true;
  });

  const ids = answers.map((a) => a.questionId);
  const questions = await prisma.examQuestion.findMany({
    where: { id: { in: ids }, certificationId: input.certificationId },
    include: { domain: { select: { name: true } } },
  });
  const qById = new Map(questions.map((q) => [q.id, q]));

  const domainAgg = new Map<string, { correct: number; total: number }>();
  const results: QuestionResult[] = [];
  let correctCount = 0;
  let answeredValid = 0;

  for (const a of answers) {
    const q = qById.get(a.questionId);
    if (!q) continue;
    answeredValid++;
    const isCorrect = sameSet(a.selected, q.correct);
    if (isCorrect) correctCount++;
    const dname = q.domain?.name ?? "General";
    const agg = domainAgg.get(dname) ?? { correct: 0, total: 0 };
    agg.total++;
    if (isCorrect) agg.correct++;
    domainAgg.set(dname, agg);
    results.push({
      questionId: q.id,
      question: q.question,
      options: q.options,
      correct: q.correct,
      selected: a.selected,
      isCorrect,
      explanation: q.explanation,
      domain: q.domain?.name ?? null,
    });
  }

  const cert = await prisma.certification.findUnique({
    where: { id: input.certificationId },
    select: { passScore: true },
  });
  const passScore = cert?.passScore ?? 75;

  // Score against a server-authoritative denominator. A cert-granting (timed)
  // run is graded over the full published question set, so unanswered questions
  // count as wrong and a partial submission cannot reach a passing score. A
  // practice run is graded over what was actually answered.
  const certQuestionCount = await prisma.examQuestion.count({
    where: { certificationId: input.certificationId },
  });
  const total = input.mode === "timed" ? certQuestionCount : answeredValid;
  const score = total ? Math.round((correctCount / total) * 100) : 0;
  const passed = score >= passScore;
  const domainBreakdown = [...domainAgg.entries()].map(([name, v]) => ({ name, ...v }));

  const attempt = await prisma.examAttempt.create({
    data: {
      userId: user.id,
      certificationId: input.certificationId,
      mode: input.mode,
      score,
      correctCount,
      totalCount: total,
      passed,
      domainBreakdown: domainBreakdown as unknown as Prisma.InputJsonValue,
      finishedAt: new Date(),
    },
  });

  // Practicing earns a little; passing earns a bonus.
  await recordActivity(user.id, Math.max(2, Math.round(score / 10)) + (passed ? 10 : 0));
  await evaluateAchievements(user.id);

  return {
    score,
    correctCount,
    totalCount: total,
    passed,
    passScore,
    domainBreakdown,
    questions: results,
    attemptId: attempt.id,
  };
}
