import type { Metadata } from "next";
import { Calendar } from "lucide-react";
import { getTodayDrop } from "@/lib/actions/daily";
import { DailySolver, DailyStreakBadge } from "@/components/daily/daily-solver";
import { PostBody } from "@/components/mdx/post-body";
import { LucideIcon } from "@/components/lucide-icon";
import {
  DIFFICULTY_CLASS,
  DIFFICULTY_LABEL,
  categoryMeta,
} from "@/lib/challenges/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Daily Drop",
  description: "One fresh challenge every day. Solve it, keep your streak.",
};

export default async function DailyPage() {
  const drop = await getTodayDrop();

  if (!drop) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold">Daily Drop</h1>
        <p className="mt-2 text-muted-foreground">
          No drop is available right now. Check back soon.
        </p>
      </div>
    );
  }

  const cat = categoryMeta(drop.meta.category);
  const prettyDate = new Date(`${drop.dateKey}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Calendar className="size-3.5" /> Daily Drop #{drop.dropNumber}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{prettyDate}</p>
        </div>
        {/* Streak lives in the local store now, so the chip is client-rendered. */}
        <DailyStreakBadge dateKey={drop.dateKey} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
            DIFFICULTY_CLASS[drop.meta.difficulty],
          )}
        >
          {DIFFICULTY_LABEL[drop.meta.difficulty]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5 text-xs text-muted-foreground">
          <LucideIcon name={cat.icon} className="size-3.5" /> {cat.label}
        </span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{drop.meta.title}</h1>
      {drop.meta.summary ? (
        <p className="mt-1 text-muted-foreground">{drop.meta.summary}</p>
      ) : null}

      <div className="my-6 rounded-lg border bg-card/40 p-5">
        <PostBody body={drop.body} />
      </div>

      <DailySolver
        dateKey={drop.dateKey}
        slug={drop.slug}
        dropNumber={drop.dropNumber}
        answerType={drop.meta.answerType}
        hints={drop.meta.hints}
      />
    </div>
  );
}
