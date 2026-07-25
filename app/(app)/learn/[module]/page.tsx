import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LucideIcon } from "@/components/lucide-icon";
import { Progress } from "@/components/ui/progress";

export async function generateMetadata(
  props: {
    params: Promise<{ module: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const mod = await prisma.module.findUnique({ where: { slug: params.module } });
  return { title: mod?.title ?? "Module" };
}

export default async function ModulePage(props: { params: Promise<{ module: string }> }) {
  const params = await props.params;
  const user = await requireUser();

  const mod = await prisma.module.findUnique({
    where: { slug: params.module },
    include: {
      lessons: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" } },
    },
  });
  if (!mod) notFound();

  const done = await prisma.lessonProgress.findMany({
    where: { userId: user.id, completed: true, lesson: { moduleId: mod.id } },
    select: { lessonId: true },
  });
  const doneSet = new Set(done.map((d) => d.lessonId));
  const completed = mod.lessons.filter((l) => doneSet.has(l.id)).length;
  const pct = mod.lessons.length ? Math.round((completed / mod.lessons.length) * 100) : 0;
  const totalMinutes = mod.lessons.reduce((s, l) => s + l.estimatedMinutes, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/learn" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> The Academy
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <LucideIcon name={mod.icon ?? "BookOpen"} className="size-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{mod.title}</h1>
            <p className="text-muted-foreground">{mod.description}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{completed}/{mod.lessons.length} lessons - about {totalMinutes} min</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      </div>

      <ol className="overflow-hidden rounded-lg border bg-card divide-y divide-border/60">
        {mod.lessons.map((lesson, i) => {
          const isDone = doneSet.has(lesson.id);
          return (
            <li key={lesson.id}>
              <Link
                href={`/learn/${mod.slug}/${lesson.slug}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/40"
              >
                <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                {isDone ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{lesson.title}</p>
                  {lesson.summary ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{lesson.summary}</p>
                  ) : null}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {lesson.estimatedMinutes}m
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
