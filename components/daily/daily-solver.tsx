"use client";

import { useState, useTransition } from "react";
import { Check, Flame, Lightbulb, Copy, Send, X } from "lucide-react";
import { toast } from "sonner";
import { submitDailyDrop } from "@/lib/actions/daily";
import { answerPlaceholder, type AnswerType } from "@/lib/challenges/config";
import { currentStreak } from "@/lib/daily/streak";
import { POINTS } from "@/lib/gamification/points";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

/** Attempt cap per drop. The store counts attempts, the client enforces the cap. */
const MAX_ATTEMPTS = 100;

/** The dateKeys of solved drops, in the shape currentStreak expects. */
function solvedKeysOf(daily: Record<string, { solvedAt?: number }>): Set<string> {
  return new Set(
    Object.entries(daily)
      .filter(([, r]) => r.solvedAt)
      .map(([key]) => key),
  );
}

/** Live streak chip for the page header. Renders nothing until the store hydrates. */
export function DailyStreakBadge({ dateKey }: { dateKey: string }) {
  const daily = useProgress((s) => s.daily);
  const hydrated = useProgressHydrated();
  if (!hydrated) return null;
  const streak = currentStreak(solvedKeysOf(daily), dateKey);
  if (streak <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-medium/30 bg-medium/10 px-3 py-1 text-sm font-medium text-medium">
      <Flame className="size-4" /> {streak}-day streak
    </span>
  );
}

interface Props {
  dateKey: string;
  slug: string;
  dropNumber: number;
  answerType: AnswerType;
  hints: string[];
}

export function DailySolver({ dateKey, slug, dropNumber, answerType, hints }: Props) {
  const daily = useProgress((s) => s.daily);
  const recordDaily = useProgress((s) => s.recordDaily);
  const hydrated = useProgressHydrated();

  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  // Progress state comes from the store; neutral (0s, unsolved) until hydrated.
  const rec = daily[dateKey];
  const solved = hydrated ? Boolean(rec?.solvedAt) : false;
  const attempts = hydrated ? (rec?.attempts ?? 0) : 0;
  const streak = hydrated ? currentStreak(solvedKeysOf(daily), dateKey) : 0;
  const capped = attempts >= MAX_ATTEMPTS;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || pending || solved || capped) return;
    setWrong(false);
    setError(null);
    start(async () => {
      const res = await submitDailyDrop(answer);
      if (res.error) {
        setError(res.error);
        return;
      }
      // recordDaily bumps attempts (no points) on a wrong answer and awards
      // the points exactly once on the first correct one.
      const fresh = recordDaily(dateKey, slug, res.correct, POINTS.DAILY);
      if (res.correct) {
        toast.success(`Daily Drop solved. +${POINTS.DAILY} pts.`);
        if (fresh.length) toast.success(`Badge earned: ${fresh.length} new`);
      } else {
        setWrong(true);
      }
    });
  }

  const shareText = [
    `Make or Break - Daily Drop #${dropNumber}`,
    `Solved in ${attempts} ${attempts === 1 ? "try" : "tries"}`,
    `Streak: ${streak} ${streak === 1 ? "day" : "days"}`,
    "make-or-break.vercel.app/daily",
  ].join("\n");

  function copyShare() {
    navigator.clipboard?.writeText(shareText).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }

  if (solved) {
    return (
      <div className="space-y-4 rounded-lg border border-success/40 bg-success/5 p-5">
        <div className="flex items-center gap-2 text-success">
          <Check className="size-5" />
          <span className="font-semibold">Solved. Nice work.</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Flame className="size-4 text-medium" /> {streak}-day streak
          </span>
          <span>
            {attempts} {attempts === 1 ? "try" : "tries"}
          </span>
        </div>
        <pre className="scrollbar-thin overflow-x-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
          {shareText}
        </pre>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyShare}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Copy className="size-4" /> {copied ? "Copied" : "Copy result"}
          </button>
          <p className="text-xs text-muted-foreground">Come back tomorrow for a new drop.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setWrong(false);
            setError(null);
          }}
          placeholder={answerPlaceholder(answerType)}
          autoComplete="off"
          spellCheck={false}
          disabled={capped}
          className={cn(
            "flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50",
            wrong && "border-destructive/60",
          )}
        />
        <button
          type="submit"
          disabled={pending || capped || !answer.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="size-4" /> {pending ? "Checking" : "Submit"}
        </button>
      </div>

      {capped ? (
        <p className="text-sm text-destructive">
          Too many attempts today. Come back for tomorrow's drop.
        </p>
      ) : wrong ? (
        <p className="inline-flex items-center gap-1.5 text-sm text-destructive">
          <X className="size-4" /> Not quite. {attempts} {attempts === 1 ? "try" : "tries"} so far.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {hints.length > 0 ? (
        <div className="pt-1">
          {hintsShown < hints.length ? (
            <button
              type="button"
              onClick={() => setHintsShown((n) => n + 1)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Lightbulb className="size-3.5" />
              {hintsShown === 0 ? "Show a hint" : "Show another hint"}
            </button>
          ) : null}
          <div className="mt-2 space-y-2">
            {hints.slice(0, hintsShown).map((h, i) => (
              <div
                key={i}
                className="rounded-md border border-dashed p-2.5 text-xs text-muted-foreground"
              >
                {h}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
