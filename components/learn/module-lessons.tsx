"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { LucideIcon } from "@/components/lucide-icon";
import { Progress } from "@/components/ui/progress";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

export interface ModuleLessonItem {
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
}

/**
 * The module page body. Content comes from the catalog via server props; the
 * progress strip and the per-lesson circles are overlaid from the store.
 */
export function ModuleLessons({
  moduleSlug,
  title,
  description,
  icon,
  lessons,
}: {
  moduleSlug: string;
  title: string;
  description: string;
  icon: string;
  lessons: ModuleLessonItem[];
}) {
  const hydrated = useProgressHydrated();
  const progress = useProgress((s) => s.lessons);

  const completed = hydrated
    ? lessons.filter((l) => progress[l.slug]?.completedAt).length
    : 0;
  const pct = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
  const totalMinutes = lessons.reduce((s, l) => s + l.estimatedMinutes, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/learn" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> The Academy
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <LucideIcon name={icon} className="size-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{completed}/{lessons.length} lessons - about {totalMinutes} min</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      </div>

      <ol className="overflow-hidden rounded-lg border bg-card divide-y divide-border/60">
        {lessons.map((lesson, i) => {
          const isDone = hydrated && Boolean(progress[lesson.slug]?.completedAt);
          return (
            <li key={lesson.slug}>
              <Link
                href={`/learn/${moduleSlug}/${lesson.slug}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/40"
              >
                <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                {isDone ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{lesson.title}</p>
                  {lesson.summary ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{lesson.summary}</p>
                  ) : null}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {lesson.estimatedMinutes}m
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
