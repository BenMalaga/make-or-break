import Link from "next/link";
import { CalendarDays, CheckCircle2, Flame, ArrowRight, Target, AlertCircle } from "lucide-react";

interface Props {
  dropNumber: number;
  title: string;
  solved: boolean;
  attempts: number;
  streak: number;
}

export function DailyDropWidget({ dropNumber, title, solved, attempts, streak }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Daily Drop #{dropNumber}
          </p>
          <p className="font-semibold">{solved ? title : "One challenge, every day"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {solved ? (
              <span className="inline-flex items-center gap-1.5 text-success">
                <CheckCircle2 className="size-3.5" /> Solved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle className="size-3.5" /> Not yet solved
              </span>
            )}
            {streak > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Flame className="size-3.5 text-medium" /> {streak}-day streak
              </span>
            ) : null}
            <span>
              {attempts} {attempts === 1 ? "attempt" : "attempts"}
            </span>
          </div>
        </div>
      </div>
      <Link
        href="/daily"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {solved ? "View" : "Solve it"} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
