import Link from "next/link";
import type { Metadata } from "next";
import type { Difficulty } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { categoriesForTrack, categoryForModule } from "@/lib/categories";
import { TRACKS, DEFAULT_TRACK, isTrackId, type TrackId } from "@/lib/tracks";
import { TrackToggle } from "@/components/learn/track-toggle";
import { ViewToggle } from "@/components/learn/view-toggle";
import { PageHeader } from "@/components/layout/page-header";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "@/components/lucide-icon";
import { StaggerGrid, StaggerItem } from "@/components/motion/motion";
import {
  AcademyBrowser,
  type CategoryGroup,
  type ModuleCard,
} from "@/components/learn/academy-browser";
import { listAllChallenges } from "@/lib/challenges";
import { ChallengesBrowser } from "@/components/challenges/challenges-browser";

export const metadata: Metadata = { title: "Learn" };

interface PathCardData {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  difficulty: Difficulty;
  total: number;
  done: number;
}

function PathCard({ p }: { p: PathCardData }) {
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
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
        <span>{p.total} steps</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} />
    </Link>
  );
}

export default async function LearnPage(
  props: {
    searchParams: Promise<{ track?: string; view?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const user = await requireUser();
  const track = isTrackId(searchParams.track) ? searchParams.track : DEFAULT_TRACK;
  const meta = TRACKS[track];

  const [modules, lessons, done, paths, rootedMachines, certs, attempts, challengeSolves] =
    await Promise.all([
      prisma.module.findMany({ orderBy: { order: "asc" } }),
      prisma.lesson.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, moduleId: true },
      }),
      prisma.lessonProgress.findMany({
        where: { userId: user.id, completed: true },
        select: { lessonId: true },
      }),
      prisma.path.findMany({
        orderBy: { order: "asc" },
        include: { items: { select: { type: true, lessonId: true, machineId: true } } },
      }),
      prisma.machineProgress.findMany({
        where: { userId: user.id, rootOwned: true },
        select: { machineId: true },
      }),
      prisma.certification.findMany({
        orderBy: { order: "asc" },
        include: {
          _count: { select: { questions: true, domains: true } },
          paths: { select: { items: { select: { lessonId: true } } } },
        },
      }),
      prisma.examAttempt.findMany({
        where: { userId: user.id },
        select: { certificationId: true, score: true, passed: true },
      }),
      prisma.challengeSolve.findMany({
        where: { userId: user.id, solved: true },
        select: { slug: true },
      }),
    ]);

  const challenges = await listAllChallenges();
  const challengeSolvedSlugs = challengeSolves.map((s) => s.slug);

  const doneSet = new Set(done.map((d) => d.lessonId));
  const machineSet = new Set(rootedMachines.map((m) => m.machineId));

  // ---- Module catalog (per track) ------------------------------------------
  const counts = new Map<string, { total: number; done: number }>();
  for (const l of lessons) {
    const c = counts.get(l.moduleId) ?? { total: 0, done: 0 };
    c.total++;
    if (doneSet.has(l.id)) c.done++;
    counts.set(l.moduleId, c);
  }

  const bySlug = new Map(modules.map((m) => [m.slug, m]));
  const toCard = (slug: string): ModuleCard | null => {
    const m = bySlug.get(slug);
    if (!m) return null;
    const c = counts.get(m.id) ?? { total: 0, done: 0 };
    return {
      slug: m.slug,
      title: m.title,
      description: m.description,
      icon: m.icon ?? "BookOpen",
      lessonCount: c.total,
      doneCount: c.done,
    };
  };

  const trackCategories = categoriesForTrack(track);
  const groups: CategoryGroup[] = trackCategories
    .map((cat) => ({
      slug: cat.slug,
      label: cat.label,
      icon: cat.icon,
      blurb: cat.blurb,
      comingSoon: cat.comingSoon,
      modules: cat.moduleSlugs.map(toCard).filter((m): m is ModuleCard => m !== null),
    }))
    .filter((g) => g.modules.length > 0 || g.comingSoon);

  if (track === "break") {
    const categorized = new Set(trackCategories.flatMap((c) => c.moduleSlugs));
    const others = modules
      .filter((m) => !categorized.has(m.slug))
      .map((m) => toCard(m.slug))
      .filter((m): m is ModuleCard => m !== null);
    if (others.length) {
      groups.push({ slug: "more", label: "More", icon: "BookOpen", blurb: "", modules: others });
    }
  }

  // ---- Paths (per track) ---------------------------------------------------
  // A path has no track column, so derive it from the modules of its lessons.
  const moduleSlugById = new Map(modules.map((m) => [m.id, m.slug]));
  const moduleIdByLesson = new Map(lessons.map((l) => [l.id, l.moduleId]));
  const trackOfLesson = (lessonId: string): TrackId | null => {
    const slug = moduleSlugById.get(moduleIdByLesson.get(lessonId) ?? "");
    return slug ? (categoryForModule(slug)?.track ?? null) : null;
  };
  const pathTrack = (p: (typeof paths)[number]): TrackId => {
    let make = 0;
    let brk = 0;
    for (const it of p.items) {
      if (it.type === "LESSON" && it.lessonId) {
        const t = trackOfLesson(it.lessonId);
        if (t === "make") make++;
        else if (t === "break") brk++;
      }
    }
    // Machine-only and security paths default to Break.
    return make > brk ? "make" : "break";
  };

  const toPathCard = (p: (typeof paths)[number]): PathCardData => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    icon: p.icon,
    difficulty: p.difficulty,
    total: p.items.length,
    done: p.items.filter((it) =>
      it.type === "LESSON"
        ? it.lessonId && doneSet.has(it.lessonId)
        : it.machineId && machineSet.has(it.machineId),
    ).length,
  });

  const trackPaths = paths.filter((p) => pathTrack(p) === track);
  const skill = trackPaths.filter((p) => !p.certificationId).map(toPathCard);
  const certPrep = trackPaths.filter((p) => p.certificationId).map(toPathCard);
  const hasPaths = skill.length + certPrep.length > 0;

  // ---- Certifications (per track) ------------------------------------------
  // A cert's track is the track of its prep-path lessons, defaulting to Break.
  const certTrack = (c: (typeof certs)[number]): TrackId => {
    for (const p of c.paths) {
      for (const it of p.items) {
        if (it.lessonId && trackOfLesson(it.lessonId) === "make") return "make";
      }
    }
    return "break";
  };
  const bestScore = new Map<string, { score: number; passed: boolean }>();
  for (const a of attempts) {
    const cur = bestScore.get(a.certificationId);
    if (!cur || a.score > cur.score) {
      bestScore.set(a.certificationId, { score: a.score, passed: a.passed || !!cur?.passed });
    }
  }
  const trackCerts = certs.filter((c) => certTrack(c) === track);

  // Default to guided paths when the track has them, else jump to the catalog.
  const view =
    searchParams.view === "modules"
      ? "modules"
      : searchParams.view === "certs"
        ? "certs"
        : searchParams.view === "challenges"
          ? "challenges"
          : searchParams.view === "paths"
            ? "paths"
            : hasPaths
              ? "paths"
              : "modules";

  const trackModuleCount = groups.reduce((s, g) => s + g.modules.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Learn" subtitle={meta.tagline} action={<TrackToggle active={track} />} />

      <ViewToggle active={view} />

      {view === "certs" ? (
        trackCerts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            No {meta.label} certifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Practice for the real exams. Timed mock exams, per-domain drills, and full answer
              explanations.
            </p>
            <StaggerGrid className="grid gap-4 md:grid-cols-2">
              {trackCerts.map((c) => {
                const b = bestScore.get(c.id);
                return (
                  <StaggerItem key={c.id} className="flex">
                    <Link
                      href={`/certs/${c.slug}`}
                      className="hover-lift flex w-full flex-col rounded-lg border bg-card p-5"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <LucideIcon name={c.icon ?? "Award"} className="size-5" />
                        </div>
                        {b ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              b.passed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Best {b.score}%
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
                        <span>{c._count.questions} questions</span>
                        <span>{c._count.domains} domains</span>
                        <span>{c.examMinutes} min exam</span>
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          </div>
        )
      ) : view === "challenges" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Coding puzzles and capture-the-flag problems for the {meta.label} track. Solve them in
            the built-in IDE, then submit your answer.
          </p>
          <ChallengesBrowser
            challenges={challenges}
            solvedSlugs={challengeSolvedSlugs}
            embedded
            forcedTrack={track}
          />
        </div>
      ) : view === "paths" ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Skill Paths</h2>
              <p className="text-muted-foreground">
                Guided routes that stack lessons and machines into a real skill.
              </p>
            </div>
            {skill.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No {meta.label} paths yet. Browse the modules to start.
                <div className="mt-3">
                  <Link
                    href={`/learn?track=${track}&view=modules`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    All {meta.label} modules
                  </Link>
                </div>
              </div>
            ) : (
              <StaggerGrid className="grid gap-4 md:grid-cols-2">
                {skill.map((p) => (
                  <StaggerItem key={p.id} className="flex">
                    <PathCard p={p} />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            )}
          </section>

          {certPrep.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Certification Prep</h2>
                <p className="text-muted-foreground">
                  A full learning path for each exam. Follow it, then sit the practice exam.
                </p>
              </div>
              <StaggerGrid className="grid gap-4 md:grid-cols-2">
                {certPrep.map((p) => (
                  <StaggerItem key={p.id} className="flex">
                    <PathCard p={p} />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {trackModuleCount > 0
              ? `${trackModuleCount} ${trackModuleCount === 1 ? "module" : "modules"} in ${meta.label}. Browse everything, or follow a path.`
              : "Curriculum in progress."}
          </p>
          <AcademyBrowser groups={groups} />
        </div>
      )}
    </div>
  );
}
