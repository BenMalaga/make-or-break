"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, CheckCircle2, Trophy, Hammer, Wrench, LayoutGrid } from "lucide-react";
import { LucideIcon } from "@/components/lucide-icon";
import {
  type ChallengeMeta,
  type ChallengeTrack,
  DIFFICULTY_CLASS,
  DIFFICULTY_LABEL,
  DIFFICULTY_ORDER,
  categoryMeta,
} from "@/lib/challenges/config";
import { cn } from "@/lib/utils";

type TrackFilter = "all" | ChallengeTrack;
type SolvedFilter = "all" | "unsolved" | "solved";

export function ChallengesBrowser({
  challenges,
  solvedSlugs,
  embedded = false,
  forcedTrack,
}: {
  challenges: ChallengeMeta[];
  solvedSlugs: string[];
  /** When embedded in the Learn tab, hide the header and track toggle. */
  embedded?: boolean;
  /** Fix the track (Learn's toggle drives it) instead of the internal tabs. */
  forcedTrack?: ChallengeTrack;
}) {
  const solved = useMemo(() => new Set(solvedSlugs), [solvedSlugs]);
  const [track, setTrack] = useState<TrackFilter>("all");
  const [category, setCategory] = useState<string | "all">("all");
  const [difficulty, setDifficulty] = useState<string | "all">("all");
  const [solvedFilter, setSolvedFilter] = useState<SolvedFilter>("all");
  const [query, setQuery] = useState("");

  // When embedded, the Learn track toggle (a route param) is the source of truth.
  const activeTrack: TrackFilter = embedded ? (forcedTrack ?? "all") : track;

  // Categories present for the current track, for the chip row.
  const categories = useMemo(() => {
    const inTrack = challenges.filter((c) => activeTrack === "all" || c.track === activeTrack);
    return Array.from(new Set(inTrack.map((c) => c.category)));
  }, [challenges, activeTrack]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return challenges
      .filter((c) => activeTrack === "all" || c.track === activeTrack)
      .filter((c) => category === "all" || c.category === category)
      .filter((c) => difficulty === "all" || c.difficulty === difficulty)
      .filter((c) =>
        solvedFilter === "all"
          ? true
          : solvedFilter === "solved"
            ? solved.has(c.slug)
            : !solved.has(c.slug),
      )
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty) ||
          a.title.localeCompare(b.title),
      );
  }, [challenges, activeTrack, category, difficulty, solvedFilter, query, solved]);

  const solvedCount = challenges.filter((c) => solved.has(c.slug)).length;

  const trackTabs: { id: TrackFilter; label: string; icon: typeof LayoutGrid }[] = [
    { id: "all", label: "All", icon: LayoutGrid },
    { id: "make", label: "Make", icon: Wrench },
    { id: "break", label: "Break", icon: Hammer },
  ];

  return (
    <div>
      {!embedded ? (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Challenges</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Coding puzzles and capture-the-flag problems. Solve them in the built-in IDE, then submit
            your answer. {solvedCount} of {challenges.length} solved.
          </p>
        </div>
      ) : null}

      {!embedded ? (
        <div className="mb-4 inline-flex rounded-lg border bg-card p-1">
          {trackTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTrack(t.id);
                setCategory("all");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                track === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-3.5" /> {t.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Filters row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search challenges"
            className="h-8 w-52 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Difficulty"
        >
          <option value="all">All difficulty</option>
          {DIFFICULTY_ORDER.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>

        <select
          value={solvedFilter}
          onChange={(e) => setSolvedFilter(e.target.value as SolvedFilter)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Solved status"
        >
          <option value="all">All</option>
          <option value="unsolved">Unsolved</option>
          <option value="solved">Solved</option>
        </select>
      </div>

      {/* Category chips */}
      {categories.length ? (
        <div className="mb-5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === "all"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            All categories
          </button>
          {categories.map((c) => {
            const m = categoryMeta(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  category === c
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/50",
                )}
              >
                <LucideIcon name={m.icon} className="size-3" /> {m.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Cards */}
      {filtered.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const m = categoryMeta(c.category);
            const isSolved = solved.has(c.slug);
            return (
              <Link
                key={c.slug}
                href={`/challenges/${c.slug}`}
                className="group relative flex flex-col rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <LucideIcon name={m.icon} className="size-4" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      DIFFICULTY_CLASS[c.difficulty],
                    )}
                  >
                    {DIFFICULTY_LABEL[c.difficulty]}
                  </span>
                  {isSolved ? (
                    <CheckCircle2 className="ml-auto size-4 text-success" />
                  ) : (
                    <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Trophy className="size-3" /> {c.points}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold leading-snug group-hover:text-primary">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {c.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No challenges match these filters yet.
        </div>
      )}
    </div>
  );
}
