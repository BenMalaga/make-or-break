"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, TriangleAlert } from "lucide-react";
import { createChallenge } from "@/lib/actions/challenges";
import {
  CATEGORY_META,
  DIFFICULTY_ORDER,
  DIFFICULTY_LABEL,
  POINTS_BY_DIFFICULTY,
  answerPlaceholder,
  type ChallengeTrack,
  type AnswerType,
} from "@/lib/challenges/config";
import { PostComposer } from "@/components/community/post-composer";
import { Button } from "@/components/ui/button";

const LANGS = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "csharp", label: "C#" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "java", label: "Java" },
];

const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ChallengeForm() {
  const [track, setTrack] = useState<ChallengeTrack>("make");
  const [difficulty, setDifficulty] = useState("EASY");
  const [answerType, setAnswerType] = useState<AnswerType>("text");
  const [state, formAction] = useFormState(createChallenge, { error: null });

  const categories = useMemo(
    () => Object.entries(CATEGORY_META).filter(([, m]) => m.track === track),
    [track],
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="ch-title" className="text-sm font-medium">Title</label>
          <input id="ch-title" name="title" required maxLength={120} placeholder="The 500th Fibonacci digit" className={field} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="ch-summary" className="text-sm font-medium">One-line summary</label>
          <input id="ch-summary" name="summary" required maxLength={160} placeholder="A short hook that shows on the card." className={field} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ch-track" className="text-sm font-medium">Track</label>
          <select id="ch-track" name="track" value={track} onChange={(e) => setTrack(e.target.value as ChallengeTrack)} className={field}>
            <option value="make">Make (code / logic / math)</option>
            <option value="break">Break (capture the flag)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ch-category" className="text-sm font-medium">Category</label>
          <select id="ch-category" name="category" className={field}>
            {categories.map(([slug, m]) => (
              <option key={slug} value={slug}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ch-difficulty" className="text-sm font-medium">Difficulty</label>
          <select id="ch-difficulty" name="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={field}>
            {DIFFICULTY_ORDER.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]} ({POINTS_BY_DIFFICULTY[d]} pts)
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ch-starterLang" className="text-sm font-medium">Starter language</label>
          <select id="ch-starterLang" name="starterLang" defaultValue="python" className={field}>
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Problem description</label>
        <PostComposer name="body" placeholder="Explain the problem. Use the toolbar for code blocks, a terminal block, and formatting. Do not reveal the answer." />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="ch-starter" className="text-sm font-medium">Starter code (optional)</label>
        <textarea
          id="ch-starter"
          name="starter"
          rows={5}
          placeholder="# a scaffold that opens in the editor"
          className="scrollbar-thin w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div className="space-y-1.5">
          <label htmlFor="ch-answerType" className="text-sm font-medium">Answer type</label>
          <select id="ch-answerType" name="answerType" value={answerType} onChange={(e) => setAnswerType(e.target.value as AnswerType)} className={field}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="flag">Flag (MOB&#123;...&#125;)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ch-answer" className="text-sm font-medium">Answer</label>
          <input id="ch-answer" name="answer" required placeholder={answerPlaceholder(answerType)} className={`${field} font-mono`} />
          <p className="text-xs text-muted-foreground">
            Stored as a hash, never shown to solvers.{" "}
            {answerType === "number"
              ? "Whitespace and commas are ignored."
              : answerType === "flag"
                ? "Matched exactly, case included."
                : "Case and extra spaces are ignored."}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="ch-hints" className="text-sm font-medium">Hints (optional, one per line)</label>
        <textarea
          id="ch-hints"
          name="hints"
          rows={3}
          placeholder={"Nudge them toward the idea.\nA second, stronger hint."}
          className="scrollbar-thin w-full resize-y rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}

/** Publish button with a pending state driven by the form's server action. */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending ? "Publishing" : "Publish challenge"}
    </Button>
  );
}
