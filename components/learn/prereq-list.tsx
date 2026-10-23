"use client";

import Link from "next/link";
import { Check, Circle, GitBranch } from "lucide-react";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

export interface PrereqItem {
  slug: string;
  title: string;
  moduleSlug: string;
}

/**
 * The "Builds on" block on a lesson page. Completion per prerequisite is
 * client-side store data, so the checkmarks appear once the store rehydrates.
 */
export function PrereqList({ prereqs }: { prereqs: PrereqItem[] }) {
  const hydrated = useProgressHydrated();
  const lessons = useProgress((s) => s.lessons);

  return (
    <div className="mb-6 rounded-lg border bg-card p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <GitBranch className="size-4 text-primary" /> Builds on
      </p>
      <ul className="space-y-1 text-sm">
        {prereqs.map((p) => {
          const done = hydrated && Boolean(lessons[p.slug]?.completedAt);
          return (
            <li key={p.slug}>
              <Link
                href={`/learn/${p.moduleSlug}/${p.slug}`}
                className="group flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                {done ? (
                  <Check className="size-3.5 shrink-0 text-success" />
                ) : (
                  <Circle className="size-3.5 shrink-0 text-muted-foreground/50" />
                )}
                <span className="underline-offset-4 group-hover:underline">{p.title}</span>
                {!done ? (
                  <span className="text-xs text-muted-foreground/70">not done yet</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
