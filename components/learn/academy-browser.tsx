"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, CheckCircle2 } from "lucide-react";
import { LucideIcon } from "@/components/lucide-icon";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ModuleCard {
  slug: string;
  title: string;
  description: string;
  icon: string;
  lessonCount: number;
  doneCount: number;
}

export interface CategoryGroup {
  slug: string;
  label: string;
  icon: string;
  blurb: string;
  modules: ModuleCard[];
  comingSoon?: boolean;
}

export function AcademyBrowser({ groups }: { groups: CategoryGroup[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return groups;
    // Search never shows coming-soon roadmap cards; they have nothing to match.
    return groups
      .filter((g) => !g.comingSoon)
      .map((g) => ({
        ...g,
        modules: g.modules.filter((m) =>
          `${m.title} ${m.description} ${g.label}`.toLowerCase().includes(query),
        ),
      }))
      .filter((g) => g.modules.length > 0);
  }, [groups, query]);

  const totalModules = groups.reduce((s, g) => s + g.modules.length, 0);

  return (
    <div className="space-y-8">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${totalModules} modules...`}
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No modules match {`"${q}"`}.
        </p>
      ) : (
        filtered.map((g) =>
          g.comingSoon ? (
            <section key={g.slug} className="rounded-lg border border-dashed bg-card/40 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <LucideIcon name={g.icon} className="size-4" />
                </div>
                <div>
                  <h2 className="font-semibold leading-tight text-muted-foreground">{g.label}</h2>
                  <p className="text-xs text-muted-foreground/80">{g.blurb}</p>
                </div>
                <span className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Coming soon
                </span>
              </div>
            </section>
          ) : (
          <section key={g.slug}>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <LucideIcon name={g.icon} className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold leading-tight">{g.label}</h2>
                <p className="text-xs text-muted-foreground">{g.blurb}</p>
              </div>
              <span className="ml-auto text-xs text-muted-foreground">{g.modules.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.modules.map((m) => {
                const pct = m.lessonCount ? Math.round((m.doneCount / m.lessonCount) * 100) : 0;
                const complete = m.lessonCount > 0 && m.doneCount === m.lessonCount;
                return (
                  <Link
                    key={m.slug}
                    href={`/learn/${m.slug}`}
                    className={cn(
                      "hover-lift group flex flex-col rounded-lg border bg-card p-4",
                      complete && "border-success/40",
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-primary transition-colors group-hover:bg-primary/15">
                        <LucideIcon name={m.icon} className="size-4" />
                      </div>
                      {complete ? <CheckCircle2 className="size-4 text-success" /> : null}
                    </div>
                    <h3 className="text-sm font-semibold leading-snug">{m.title}</h3>
                    <p className="mb-3 mt-0.5 line-clamp-2 flex-1 text-xs text-muted-foreground">
                      {m.description}
                    </p>
                    <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>{m.doneCount}/{m.lessonCount} lessons</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </Link>
                );
              })}
            </div>
          </section>
          ),
        )
      )}
    </div>
  );
}
