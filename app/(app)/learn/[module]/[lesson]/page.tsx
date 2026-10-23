import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Target,
  AlertTriangle,
} from "lucide-react";
import { categoryForModule } from "@/lib/categories";
import { catalogLesson, catalogModuleLessons } from "@/lib/content/catalog";
import { readLesson } from "@/lib/content/mdx";
import { Mdx } from "@/lib/content/render";
import { LessonInteractiveProvider } from "@/lib/content/lesson-context";
import { LessonCompleteButton } from "@/components/learn/lesson-complete-button";
import { PrereqList } from "@/components/learn/prereq-list";
import { FloatingNotes } from "@/components/notes/floating-notes";
import { Button } from "@/components/ui/button";

type Params = { module: string; lesson: string };

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  return { title: catalogLesson(params.lesson)?.title ?? "Lesson" };
}

export default async function LessonPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const lesson = catalogLesson(params.lesson);
  if (!lesson || lesson.moduleSlug !== params.module) notFound();

  const siblings = catalogModuleLessons(params.module);
  const raw = readLesson(lesson.contentRef);
  const idx = siblings.findIndex((s) => s.slug === lesson.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  // What this lesson builds on. Whether the reader has done each one is store
  // data, resolved client-side by PrereqList.
  const prereqs = lesson.prerequisites
    .map((slug) => catalogLesson(slug))
    .filter((l) => l !== null)
    .map((l) => ({ slug: l.slug, title: l.title, moduleSlug: l.moduleSlug }));

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/learn/${params.module}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {lesson.moduleTitle}
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

      {prereqs.length ? <PrereqList prereqs={prereqs} /> : null}

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
        <LessonInteractiveProvider key={lesson.slug} lessonSlug={lesson.slug}>
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
        <LessonCompleteButton lessonSlug={lesson.slug} />
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
