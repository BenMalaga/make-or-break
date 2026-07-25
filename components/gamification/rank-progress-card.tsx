import { LucideIcon } from "@/components/lucide-icon";
import { Progress } from "@/components/ui/progress";
import { rankForPoints } from "@/lib/gamification";
import { formatPoints } from "@/lib/utils";

/** Current rank, points, and progress to the next rank. */
export function RankProgressCard({ points }: { points: number }) {
  const { current, next, percentToNext, pointsForNext } = rankForPoints(points);

  return (
    <div className="glow-primary rounded-lg border bg-card p-5">
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <LucideIcon name={current.icon} className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="kicker">Current rank</p>
          <p className="truncate text-lg font-semibold">{current.title}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-primary">{formatPoints(points)}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{next ? `Next: ${next.title}` : "Max rank reached"}</span>
          {next ? <span>{formatPoints(pointsForNext)} pts to go</span> : null}
        </div>
        <Progress value={percentToNext} />
      </div>
    </div>
  );
}
