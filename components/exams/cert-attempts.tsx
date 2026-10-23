"use client";

import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { timeAgo } from "@/lib/utils";

/** Attempt history for one cert, read from the local store. Renders nothing
 * until the store hydrates (and nothing when there are no attempts). */
export function CertAttempts({ certSlug }: { certSlug: string }) {
  const exams = useProgress((s) => s.exams);
  const hydrated = useProgressHydrated();

  // addExam prepends, so the first entries are the most recent.
  const attempts = hydrated ? exams.filter((e) => e.cert === certSlug).slice(0, 6) : [];
  if (attempts.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-5 py-3">
        <h2 className="text-sm font-semibold">Your attempts</h2>
      </div>
      <ul className="divide-y divide-border/60">
        {attempts.map((a, i) => (
          <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              {a.mode} - {a.correctCount}/{a.totalCount} - {timeAgo(a.at)}
            </span>
            <span className={a.passed ? "font-medium text-success" : "font-medium text-muted-foreground"}>
              {a.score}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
