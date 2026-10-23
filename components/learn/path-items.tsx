"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Server, CheckCircle2, Circle } from "lucide-react";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import type { Difficulty } from "@/lib/content/types";

export interface PathItemData {
  kind: "lesson" | "machine";
  slug: string;
  title: string;
  sub: string;
  href: string;
  difficulty?: Difficulty;
}

/**
 * The path page body. Items come from the path MDX resolved against the
 * catalogs via server props; the dots, checks, and percent are overlaid from
 * the progress store (lessons by completion, machines by a ROOT flag).
 */
export function PathItems({
  title,
  description,
  difficulty,
  items,
}: {
  title: string;
  description: string;
  difficulty: Difficulty;
  items: PathItemData[];
}) {
  const hydrated = useProgressHydrated();
  const lessons = useProgress((s) => s.lessons);
  const machines = useProgress((s) => s.machines);

  const isDone = (item: PathItemData) =>
    hydrated &&
    (item.kind === "lesson"
      ? Boolean(lessons[item.slug]?.completedAt)
      : Object.values(machines[item.slug]?.flags ?? {}).some((f) => f.kind === "ROOT"));

  const total = items.length;
  const done = items.filter(isDone).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/learn?view=paths" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Paths
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <DifficultyBadge difficulty={difficulty} />
        </div>
        <p className="mt-1 text-muted-foreground">{description}</p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{done}/{total} complete</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      </div>

      <ol className="relative space-y-3">
        {/* continuous connector line, masked at each node by the dot's ring */}
        <span
          aria-hidden
          className="absolute left-[10px] top-5 bottom-5 w-0.5 -translate-x-1/2 bg-border"
        />
        {items.map((item) => {
          const complete = isDone(item);
          return (
            <li key={`${item.kind}-${item.slug}`} className="relative flex items-center gap-4">
              <span
                className={cn(
                  "relative z-10 size-5 shrink-0 rounded-full ring-4 ring-background",
                  complete ? "bg-success" : "bg-muted-foreground/30",
                )}
              />
              <Link
                href={item.href}
                className="flex flex-1 items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
              >
                {item.kind === "lesson" ? (
                  <BookOpen className="size-5 shrink-0 text-info" />
                ) : (
                  <Server className="size-5 shrink-0 text-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                {complete ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground" />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
