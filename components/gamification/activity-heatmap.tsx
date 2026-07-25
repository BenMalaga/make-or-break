"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface ActivityDay {
  date: string;
  count: number;
}

const WEEKS = 26;

function levelClass(count: number): string {
  if (count <= 0) return "bg-muted/40";
  if (count === 1) return "bg-primary/30";
  if (count <= 3) return "bg-primary/50";
  if (count <= 5) return "bg-primary/75";
  return "bg-primary";
}

interface Cell {
  date: string;
  count: number;
  future: boolean;
}

/** GitHub-style activity calendar of the last ~26 weeks. */
export function ActivityHeatmap({ activity }: { activity: ActivityDay[] }) {
  const { weeks, total } = useMemo(() => {
    const counts = new Map(activity.map((a) => [a.date, a.count]));
    const today = new Date();
    const start = new Date(today);
    // Back up to the Sunday that begins the window.
    start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

    const cols: Cell[][] = [];
    const cursor = new Date(start);
    let total = 0;
    for (let w = 0; w < WEEKS; w++) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const key = cursor.toISOString().slice(0, 10);
        const future = cursor > today;
        const count = counts.get(key) ?? 0;
        if (!future) total += count;
        col.push({ date: key, count, future });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(col);
    }
    return { weeks: cols, total };
  }, [activity]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} actions in the last 6 months</span>
        <span className="flex items-center gap-1">
          Less
          {["bg-muted/40", "bg-primary/30", "bg-primary/50", "bg-primary/75", "bg-primary"].map(
            (c) => (
              <span key={c} className={cn("size-2.5 rounded-sm", c)} />
            ),
          )}
          More
        </span>
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((col, i) => (
            <div key={i} className="flex flex-col gap-1">
              {col.map((cell) => (
                <span
                  key={cell.date}
                  title={cell.future ? undefined : `${cell.count} on ${cell.date}`}
                  className={cn(
                    "size-2.5 rounded-sm",
                    cell.future ? "bg-transparent" : levelClass(cell.count),
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
