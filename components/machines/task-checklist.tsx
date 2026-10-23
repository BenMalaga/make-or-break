"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

export interface TaskItem {
  /** Stable store key: the task title (titles are unique within a machine). */
  key: string;
  title: string;
  description?: string;
}

/** Objectives checklist, stored entirely in the browser's progress store. */
export function TaskChecklist({
  machineSlug,
  tasks,
}: {
  machineSlug: string;
  tasks: TaskItem[];
}) {
  const saved = useProgress((s) => s.machines[machineSlug]?.tasks);
  const toggleTask = useProgress((s) => s.toggleTask);
  const hydrated = useProgressHydrated();

  const done = tasks.filter((t) => hydrated && saved?.[t.key]).length;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h3 className="font-semibold">Objectives</h3>
        <span className="text-xs text-muted-foreground">
          {done}/{tasks.length}
        </span>
      </div>
      <ul className="divide-y divide-border/60">
        {tasks.map((t) => {
          const checked = Boolean(hydrated && saved?.[t.key]);
          return (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => toggleTask(machineSlug, t.key, !checked)}
                className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/40"
              >
                {checked ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className={cn("text-sm font-medium", checked && "text-muted-foreground line-through")}>
                    {t.title}
                  </span>
                  {t.description ? (
                    <span className="block text-xs text-muted-foreground">{t.description}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
