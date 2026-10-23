"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X, Flag, ChevronLeft, ChevronRight, Clock, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { submitExam, type ExamResult, type ClientQuestion } from "@/lib/actions/exams";
import { useProgress } from "@/lib/progress/store";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function ExamRunner({
  certSlug,
  certName,
  mode,
  examMinutes,
  questions,
  backHref,
  examHref,
}: {
  certSlug: string;
  certName: string;
  mode: "practice" | "timed" | "domain";
  examMinutes: number;
  questions: ClientQuestion[];
  backHref: string;
  examHref: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [index, setIndex] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(
    mode === "timed" ? examMinutes * 60 : null,
  );
  const [result, setResult] = useState<ExamResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const addExam = useProgress((s) => s.addExam);

  const q = questions[index];
  const answeredCount = questions.filter((x) => (answers[x.id]?.length ?? 0) > 0).length;

  async function doSubmit() {
    if (submittingRef.current || result) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const r = await submitExam({
        certSlug,
        mode,
        answers: questions.map((x) => ({ questionId: x.id, selected: answers[x.id] ?? [] })),
      });
      // The attempt lives in the local store; the store awards no exam points.
      const fresh = addExam({
        cert: certSlug,
        mode,
        score: r.score,
        passed: r.passed,
        correctCount: r.correctCount,
        totalCount: r.totalCount,
        at: Date.now(),
      });
      setResult(r);
      toast.success(r.passed ? `Passed with ${r.score}%.` : `Scored ${r.score}%.`);
      if (fresh.length) toast.success(`Badge earned: ${fresh.length} new`);
      window.scrollTo({ top: 0 });
    } catch {
      toast.error("Could not submit exam. Try again.");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  // Guard the manual submit buttons so a half-finished attempt is not lost by a
  // stray click. The timed auto-submit calls doSubmit directly (no prompt).
  function confirmSubmit() {
    const unanswered = questions.length - answeredCount;
    if (
      unanswered > 0 &&
      !window.confirm(
        `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`,
      )
    ) {
      return;
    }
    void doSubmit();
  }

  // Countdown for timed mode.
  useEffect(() => {
    if (mode !== "timed" || result || timeLeft === null) return;
    if (timeLeft <= 0) {
      void doSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeLeft, result]);

  function choose(optionIndex: number) {
    if (!q) return;
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      if (q.multi) {
        const next = cur.includes(optionIndex)
          ? cur.filter((i) => i !== optionIndex)
          : [...cur, optionIndex];
        return { ...prev, [q.id]: next };
      }
      return { ...prev, [q.id]: [optionIndex] };
    });
  }

  function toggleFlag() {
    if (!q) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  }

  // ---- Results view --------------------------------------------------------
  if (result) {
    return <ResultsView result={result} certName={certName} backHref={backHref} examHref={examHref} />;
  }

  // ---- Exam view -----------------------------------------------------------
  const mm = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const ss = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{certName}</p>
          <h1 className="text-lg font-semibold">
            Question {index + 1} of {questions.length}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {timeLeft !== null ? (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-sm",
                timeLeft < 60 && "border-destructive text-destructive",
              )}
            >
              <Clock className="size-4" />
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Navigator */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((x, i) => {
          const isAnswered = (answers[x.id]?.length ?? 0) > 0;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to question ${i + 1}${isAnswered ? ", answered" : ""}${flagged.has(x.id) ? ", flagged" : ""}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "relative size-7 rounded text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                i === index
                  ? "bg-primary text-primary-foreground"
                  : isAnswered
                    ? "bg-primary/20 text-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {i + 1}
              {flagged.has(x.id) ? (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warning" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Question */}
      {q ? (
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            {q.domain ? (
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{q.domain}</span>
            ) : <span />}
            <button
              type="button"
              onClick={toggleFlag}
              className={cn(
                "flex items-center gap-1 rounded text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                flagged.has(q.id) ? "text-warning" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Flag className="size-3.5" /> {flagged.has(q.id) ? "Flagged" : "Flag"}
            </button>
          </div>
          <p className="mb-4 font-medium leading-relaxed">{q.question}</p>
          {q.multi ? (
            <p className="mb-2 text-xs text-muted-foreground">Select all that apply.</p>
          ) : null}
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const selected = (answers[q.id] ?? []).includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected ? "border-primary bg-primary/10" : "hover:border-primary/50 hover:bg-accent/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded text-xs font-semibold",
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ChevronLeft className="size-4" /> Prev
        </Button>
        {index < questions.length - 1 ? (
          <Button variant="outline" onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            Next <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={confirmSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null} Submit exam
          </Button>
        )}
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={confirmSubmit} disabled={submitting}>
          Finish + submit now
        </Button>
      </div>
    </div>
  );
}

function ResultsView({
  result,
  certName,
  backHref,
  examHref,
}: {
  result: ExamResult;
  certName: string;
  backHref: string;
  examHref: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">{certName}</p>
        <p className={cn("mt-2 text-5xl font-bold", result.passed ? "text-success" : "text-destructive")}>
          {result.score}%
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {result.correctCount} of {result.totalCount} correct - pass mark {result.passScore}%
        </p>
        <span
          className={cn(
            "mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium",
            result.passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {result.passed ? "Passed" : "Keep studying"}
        </span>
        <div className="mt-5 flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href={backHref}>Back to cert</Link>
          </Button>
          <Button asChild>
            <a href={examHref}>
              <RotateCcw className="size-4" /> Retake
            </a>
          </Button>
        </div>
      </div>

      {result.domainBreakdown.length > 1 ? (
        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">By domain</h2>
          </div>
          <div className="space-y-3 p-5">
            {result.domainBreakdown.map((d) => {
              const pct = d.total ? Math.round((d.correct / d.total) * 100) : 0;
              return (
                <div key={d.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">{d.name}</span>
                    <span>
                      {d.correct}/{d.total} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Review</h2>
        {result.questions.map((r, qi) => (
          <div key={r.questionId} className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  r.isCorrect ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                )}
              >
                {r.isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              </span>
              <p className="text-sm font-medium">
                {qi + 1}. {r.question}
              </p>
            </div>
            <div className="ml-7 space-y-1.5">
              {r.options.map((opt, i) => {
                const isCorrect = r.correct.includes(i);
                const isChosen = r.selected.includes(i);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1 text-sm",
                      isCorrect && "bg-success/10 text-success",
                      isChosen && !isCorrect && "bg-destructive/10 text-destructive",
                    )}
                  >
                    <span className="font-mono text-xs">{LETTERS[i]}</span>
                    <span>{opt}</span>
                    {isCorrect ? <Check className="ml-auto size-3.5" /> : null}
                    {isChosen && !isCorrect ? <X className="ml-auto size-3.5" /> : null}
                  </div>
                );
              })}
            </div>
            {r.explanation ? (
              <p className="ml-7 mt-2 text-xs leading-relaxed text-muted-foreground">{r.explanation}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
