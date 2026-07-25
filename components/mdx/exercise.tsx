"use client";

import { useState, type ReactNode } from "react";
import { Check, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLessonInteractive } from "@/lib/content/lesson-context";

/**
 * A checkable exercise. Two modes:
 *  - with `answer`: a validated fill-in (case-insensitive, trimmed).
 *  - without `answer`: a self-marked "I did this" checkbox.
 *
 * MDX usage:
 *   <Exercise id="ex-cidr" prompt="What is the network address of 10.0.5.130/26?" answer="10.0.5.128" />
 *   <Exercise id="ex-scan" prompt="Run the scan against your VM and note the open ports." />
 */
export function Exercise({
  id,
  prompt,
  answer,
  placeholder = "your answer",
  children,
}: {
  id: string;
  prompt: string;
  answer?: string;
  placeholder?: string;
  children?: ReactNode;
}) {
  const ctx = useLessonInteractive();
  const priorDone = ctx?.interactive.exercises[id] ?? false;
  const [done, setDone] = useState(priorDone);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">(
    priorDone ? "correct" : "idle",
  );

  function mark(next: boolean) {
    setDone(next);
    ctx?.recordExercise(id, next);
  }

  function check() {
    const ok = value.trim().toLowerCase() === (answer ?? "").trim().toLowerCase();
    setStatus(ok ? "correct" : "wrong");
    if (ok) mark(true);
  }

  return (
    <div className="my-4 rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-start gap-2">
        <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
          Exercise
        </span>
      </div>
      <p className="mb-3 text-sm">{prompt}</p>
      {children ? <div className="mb-3 text-sm text-muted-foreground">{children}</div> : null}

      {answer ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder={placeholder}
            disabled={status === "correct"}
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          <button
            type="button"
            onClick={check}
            disabled={status === "correct"}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {status === "correct" ? <Check className="size-4" /> : null}
            {status === "correct" ? "Solved" : "Check"}
          </button>
          {status === "wrong" ? (
            <span className="text-sm text-destructive">Try again.</span>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => mark(!done)}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
            done ? "border-success/60 bg-success/10 text-success" : "hover:bg-accent/50",
          )}
        >
          {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
          {done ? "Done" : "Mark done"}
        </button>
      )}
    </div>
  );
}
