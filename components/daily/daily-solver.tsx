"use client";

import { useState, useTransition } from "react";
import { Check, Flame, Lightbulb, Copy, Send, X } from "lucide-react";
import { submitDailyDrop, type DailySubmitResult } from "@/lib/actions/daily";
import { answerPlaceholder, type AnswerType } from "@/lib/challenges/config";
import { cn } from "@/lib/utils";

interface Props {
  dropNumber: number;
  answerType: AnswerType;
  hints: string[];
  initialSolved: boolean;
  initialAttempts: number;
  initialStreak: number;
}

export function DailySolver({
  dropNumber,
  answerType,
  hints,
  initialSolved,
  initialAttempts,
  initialStreak,
}: Props) {
  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState(initialSolved);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [streak, setStreak] = useState(initialStreak);
  const [wrong, setWrong] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || pending || solved) return;
    setWrong(false);
    setError(null);
    start(async () => {
      const res: DailySubmitResult = await submitDailyDrop(answer);
      if (res.error) {
        setError(res.error);
        return;
      }
      setAttempts(res.attempts);
      setStreak(res.streak);
      if (res.solved) {
        setSolved(true);
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
          className={cn(
            "flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40",
            wrong && "border-destructive/60",
          )}
        />
        <button
          type="submit"
          disabled={pending || !answer.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="size-4" /> {pending ? "Checking" : "Submit"}
        </button>
      </div>

      {wrong ? (
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
