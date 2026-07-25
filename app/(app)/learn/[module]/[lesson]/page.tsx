import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Clock,
  GitBranch,
  Target,
  AlertTriangle,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { categoryForModule } from "@/lib/categories";
import { readLesson } from "@/lib/content/mdx";
import { Mdx } from "@/lib/content/render";
import {
  LessonInteractiveProvider,
  type InteractiveState,
} from "@/lib/content/lesson-context";
import { LessonCompleteButton } from "@/components/learn/lesson-complete-button";
import { FloatingNotes } from "@/components/notes/floating-notes";
import { Button } from "@/components/ui/button";

type Params = { module: string; lesson: string };

export async function generateMetadata(
  props: {
    params: Promise<Params>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const lesson = await prisma.lesson.findUnique({ where: { slug: params.lesson } });
  return { title: lesson?.title ?? "Lesson" };
}

export default async function LessonPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const user = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: { slug: params.lesson },
    include: { module: true },
  });
  if (!lesson || lesson.module.slug !== params.module) notFound();

  const [progress, siblings, prereqs] = await Promise.all([
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    prisma.lesson.findMany({
      where: { moduleId: lesson.moduleId, status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: { slug: true, title: true, order: true },
    }),
    // What this lesson builds on, and whether the reader has actually done it.
    lesson.prerequisites.length
      ? prisma.lesson.findMany({
          where: { slug: { in: lesson.prerequisites }, status: "PUBLISHED" },
          select: {
            slug: true,
            title: true,
            module: { select: { slug: true } },
            progress: {
              where: { userId: user.id },
              select: { completed: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const raw = readLesson(lesson.contentRef);
  const idx = siblings.findIndex((s) => s.slug === lesson.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const interactive = (progress?.interactive as Partial<InteractiveState> | null) ?? null;

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/learn/${params.module}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {lesson.module.title}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        {lesson.summary ? (
          <p className="mt-2 text-lg text-muted-foreground">{lesson.summary}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" /> {lesson.estimatedMinutes} min
          </span>
          {lesson.tags.length ? (
            <span className="flex flex-wrap gap-1.5">
              {lesson.tags.map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {t}
                </span>
              ))}
            </span>
          ) : null}
        </div>
      </div>

      {prereqs.length ? (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <GitBranch className="size-4 text-primary" /> Builds on
          </p>
          <ul className="space-y-1 text-sm">
            {prereqs.map((p) => {
              const done = p.progress[0]?.completed ?? false;
              return (
                <li key={p.slug}>
                  <Link
                    href={`/learn/${p.module.slug}/${p.slug}`}
                    className="group flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    {done ? (
                      <Check className="size-3.5 shrink-0 text-success" />
                    ) : (
                      <Circle className="size-3.5 shrink-0 text-muted-foreground/50" />
                    )}
                    <span className="underline-offset-4 group-hover:underline">{p.title}</span>
                    {!done ? (
                      <span className="text-xs text-muted-foreground/70">not done yet</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {lesson.objectives.length ? (
        <div className="mb-8 rounded-lg border bg-card p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 text-primary" /> What you will learn
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {lesson.objectives.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="text-primary">-</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {raw ? (
        <LessonInteractiveProvider
          lessonId={lesson.id}
          initialInteractive={interactive}
          initialNotes={progress?.notes ?? ""}
        >
          <div className="text-[0.95rem]">
            <Mdx source={raw.body} autoWrapTerms={categoryForModule(params.module)?.track !== "make"} />
          </div>
          <FloatingNotes />
        </LessonInteractiveProvider>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          Content file <code className="font-mono">{lesson.contentRef}.mdx</code> not found.
        </div>
      )}

      <div className="mt-10 flex flex-col gap-4 border-t pt-6">
        <LessonCompleteButton lessonId={lesson.id} initialCompleted={progress?.completed ?? false} />
        <div className="flex items-center justify-between gap-4">
          {prev ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/learn/${params.module}/${prev.slug}`}>
                <ArrowLeft className="size-4" /> {prev.title}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/learn/${params.module}/${next.slug}`}>
                {next.title} <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </article>
  );
}
