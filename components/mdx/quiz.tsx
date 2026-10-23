"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLessonInteractive } from "@/lib/content/lesson-context";

/**
 * MDX usage:
 *   <Quiz id="cidr-1" question="How many hosts in a /29?" answer={1}
 *     options={["4", "6", "8", "14"]}
 *     explanation="/29 = 8 addresses, minus network + broadcast = 6 usable." />
 *
 * `id` must be unique within the lesson (used as the persistence key).
 */
export function Quiz({
  id,
  question,
  options,
  answer,
  explanation,
}: {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}) {
  const ctx = useLessonInteractive();
  const prior = ctx?.interactive.quizzes[id];
  const [selected, setSelected] = useState<number | null>(prior?.selected ?? null);
  const picked = useRef(false);
  const adopted = useRef(false);
  const answered = selected !== null;
  const correct = selected === answer;

  // The store rehydrates after mount, so a saved answer can arrive after the
  // first render; adopt it once, unless the reader answered during this visit.
  useEffect(() => {
    if (adopted.current || !prior) return;
    adopted.current = true;
    if (!picked.current) setSelected(prior.selected);
  }, [prior]);

  function choose(i: number) {
    if (answered) return;
    picked.current = true;
    setSelected(i);
    ctx?.recordQuiz(id, { selected: i, correct: i === answer });
  }

  function reset() {
    setSelected(null);
  }

  return (
    <div className="my-4 rounded-lg border bg-card p-4">
      <p className="mb-3 text-sm font-semibold">{question}</p>
      <div className="grid gap-2">
        {options.map((opt, i) => {
          const isAnswer = i === answer;
          const isChosen = i === selected;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => choose(i)}
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                !answered && "hover:border-primary/60 hover:bg-accent/50",
                answered && isAnswer && "border-success/60 bg-success/10",
                answered && isChosen && !isAnswer && "border-destructive/60 bg-destructive/10",
                answered && !isAnswer && !isChosen && "opacity-60",
              )}
            >
              <span>{opt}</span>
              {answered && isAnswer ? <Check className="size-4 text-success" /> : null}
              {answered && isChosen && !isAnswer ? <X className="size-4 text-destructive" /> : null}
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className="mt-3 flex items-start justify-between gap-3">
          <p className={cn("text-sm", correct ? "text-success" : "text-destructive")}>
            {correct ? "Correct." : "Not quite."}{" "}
            {explanation ? <span className="text-muted-foreground">{explanation}</span> : null}
          </p>
          {!correct ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" /> Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
