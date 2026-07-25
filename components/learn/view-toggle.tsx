"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Route, LayoutGrid, Award, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";

export type LearnView = "paths" | "modules" | "certs" | "challenges";

/**
 * Within a track, switch between guided Learning Paths, the full module catalog,
 * and Certifications. Drives the `?view=` param and preserves `?track=`.
 */
export function ViewToggle({ active }: { active: LearnView }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(view: LearnView) {
    if (view === active) return;
    const next = new URLSearchParams(params);
    next.set("view", view);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const items = [
    { id: "paths" as const, label: "Learning Paths", icon: Route },
    { id: "modules" as const, label: "Modules", icon: LayoutGrid },
    { id: "certs" as const, label: "Certifications", icon: Award },
    { id: "challenges" as const, label: "Challenges", icon: Puzzle },
  ];

  return (
    <div className="inline-flex flex-wrap rounded-lg border bg-card p-1">
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => select(it.id)}
            aria-pressed={on}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <it.icon className="size-4" />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
