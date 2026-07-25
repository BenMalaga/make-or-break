import Link from "next/link";
import { CalendarDays, CheckCircle2, ArrowRight, Trophy } from "lucide-react";
import { LucideIcon } from "@/components/lucide-icon";
import {
  categoryMeta,
  DIFFICULTY_LABEL,
  DIFFICULTY_CLASS,
  type ChallengeMeta,
} from "@/lib/challenges/config";
import { cn } from "@/lib/utils";

/** The dashboard "challenge of the day" banner. */
export function DailyChallengeCard({
  challenge,
  solved,
}: {
  challenge: ChallengeMeta;
  solved: boolean;
}) {
  const cat = categoryMeta(challenge.category);
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Challenge of the day
          </p>
          <p className="font-semibold">{challenge.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                DIFFICULTY_CLASS[challenge.difficulty],
              )}
            >
              {DIFFICULTY_LABEL[challenge.difficulty]}
            </span>
            <span className="flex items-center gap-1">
              <LucideIcon name={cat.icon} className="size-3" /> {cat.label}
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="size-3" /> {challenge.points} pts
            </span>
          </div>
        </div>
      </div>
      <div className="shrink-0">
        {solved ? (
          <span className="flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
            <CheckCircle2 className="size-4" /> Solved today
          </span>
        ) : (
          <Link
            href={`/challenges/${challenge.slug}`}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Solve it <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
