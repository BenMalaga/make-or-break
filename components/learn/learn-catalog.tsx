"use client";

import Link from "next/link";
import { AcademyBrowser, type CategoryGroup } from "@/components/learn/academy-browser";
import { ChallengesBrowser } from "@/components/challenges/challenges-browser";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "@/components/lucide-icon";
import { StaggerGrid, StaggerItem } from "@/components/motion/motion";
import type { LearnView } from "@/components/learn/view-toggle";
import type { ChallengeMeta } from "@/lib/challenges/config";
import type { Difficulty } from "@/lib/content/types";
import type { TrackId } from "@/lib/tracks";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

export interface PathCardData {
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  difficulty: Difficulty;
  lessonSlugs: string[];
  machineSlugs: string[];
}

export interface CertCardData {
  slug: string;
  code: string;
  name: string;
  vendor: string;
  description: string;
  icon: string | null;
  examMinutes: number;
  questionCount: number;
  domainCount: number;
}

/** One path card; completion is overlaid from the progress store. */
function PathCard({ p }: { p: PathCardData }) {
  const hydrated = useProgressHydrated();
  const lessons = useProgress((s) => s.lessons);
  const machines = useProgress((s) => s.machines);
  const total = p.lessonSlugs.length + p.machineSlugs.length;
  const done = hydrated
    ? p.lessonSlugs.filter((s) => lessons[s]?.completedAt).length +
      p.machineSlugs.filter((s) =>
        Object.values(machines[s]?.flags ?? {}).some((f) => f.kind === "ROOT"),
      ).length
    : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Link
      href={`/paths/${p.slug}`}
      className="hover-lift flex h-full w-full flex-col rounded-lg border bg-card p-5"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LucideIcon name={p.icon ?? "Route"} className="size-5" />
        </div>
        <DifficultyBadge difficulty={p.difficulty} />
      </div>
      <h3 className="font-semibold">{p.title}</h3>
      <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{p.description}</p>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{total} steps</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} />
    </Link>
  );
}

export function LearnCatalog({
  track,
  trackLabel,
  view,
  groups,
  paths,
  certs,
  challenges,
  trackModuleCount,
}: {
  track: TrackId;
  trackLabel: string;
  view: LearnView;
  groups: CategoryGroup[];
  paths: PathCardData[];
  certs: CertCardData[];
  challenges: ChallengeMeta[];
  trackModuleCount: number;
}) {
  const hydrated = useProgressHydrated();
  const challengesState = useProgress((s) => s.challenges);
  const exams = useProgress((s) => s.exams);

  if (view === "certs") {
    if (certs.length === 0) {
      return (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No {trackLabel} certifications yet.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Practice for the real exams. Timed mock exams, per-domain drills, and full answer
          explanations.
        </p>
        <StaggerGrid className="grid gap-4 md:grid-cols-2">
          {certs.map((c) => {
            // Best attempt across the learner's stored exam records.
            let best: { score: number; passed: boolean } | undefined;
            if (hydrated) {
              for (const e of exams) {
                if (e.cert !== c.slug) continue;
                if (!best || e.score > best.score) {
                  best = { score: e.score, passed: e.passed || Boolean(best?.passed) };
                }
              }
            }
            return (
              <StaggerItem key={c.slug} className="flex">
                <Link
                  href={`/certs/${c.slug}`}
                  className="hover-lift flex w-full flex-col rounded-lg border bg-card p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LucideIcon name={c.icon ?? "Award"} className="size-5" />
                    </div>
                    {best ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          best.passed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        Best {best.score}%
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.vendor} - {c.code}
                  </p>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                  <div className="mt-4 flex gap-4 border-t pt-3 text-xs text-muted-foreground">
                    <span>{c.questionCount} questions</span>
                    <span>{c.domainCount} domains</span>
                    <span>{c.examMinutes} min exam</span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      </div>
    );
  }

  if (view === "challenges") {
    const solvedSlugs = hydrated
      ? Object.entries(challengesState)
          .filter(([, r]) => r.solvedAt)
          .map(([slug]) => slug)
      : [];
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Coding puzzles and capture-the-flag problems for the {trackLabel} track. Solve them in
          the built-in IDE, then submit your answer.
        </p>
        <ChallengesBrowser
          challenges={challenges}
          solvedSlugs={solvedSlugs}
          embedded
          forcedTrack={track}
        />
      </div>
    );
  }

  if (view === "paths") {
    return (
      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Skill Paths</h2>
            <p className="text-muted-foreground">
              Guided routes that stack lessons and machines into a real skill.
            </p>
          </div>
          {paths.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No {trackLabel} paths yet. Browse the modules to start.
              <div className="mt-3">
                <Link
                  href={`/learn?track=${track}&view=modules`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  All {trackLabel} modules
                </Link>
              </div>
            </div>
          ) : (
            <StaggerGrid className="grid gap-4 md:grid-cols-2">
              {paths.map((p) => (
                <StaggerItem key={p.slug} className="flex">
                  <PathCard p={p} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {trackModuleCount > 0
          ? `${trackModuleCount} ${trackModuleCount === 1 ? "module" : "modules"} in ${trackLabel}. Browse everything, or follow a path.`
          : "Curriculum in progress."}
      </p>
      <AcademyBrowser groups={groups} />
    </div>
  );
}
