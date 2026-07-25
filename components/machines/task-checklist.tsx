"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleTask } from "@/lib/actions/machines";
import { cn } from "@/lib/utils";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
}

export function TaskChecklist({ tasks }: { tasks: TaskItem[] }) {
  const [state, setState] = useState(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.done])),
  );

  function toggle(id: string) {
    const next = !state[id];
    setState((s) => ({ ...s, [id]: next }));
    void toggleTask(id, next).catch(() => setState((s) => ({ ...s, [id]: !next })));
  }

  const done = Object.values(state).filter(Boolean).length;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h3 className="font-semibold">Objectives</h3>
        <span className="text-xs text-muted-foreground">
          {done}/{tasks.length}
        </span>
      </div>
      <ul className="divide-y divide-border/60">
        {tasks.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => toggle(t.id)}
              className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/40"
            >
              {state[t.id] ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span>
                <span className={cn("text-sm font-medium", state[t.id] && "text-muted-foreground line-through")}>
                  {t.title}
                </span>
                {t.description ? (
                  <span className="block text-xs text-muted-foreground">{t.description}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
