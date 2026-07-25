import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Server, CheckCircle2, Circle, Award } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const p = await prisma.path.findUnique({ where: { slug: params.slug } });
  return { title: p?.title ?? "Path" };
}

export default async function PathPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const user = await requireUser();

  const path = await prisma.path.findUnique({
    where: { slug: params.slug },
    include: {
      certification: { select: { slug: true, name: true } },
      items: {
        orderBy: { order: "asc" },
        include: {
          lesson: { include: { module: true } },
          machine: true,
        },
      },
    },
  });
  if (!path) notFound();

  const [doneLessons, rootedMachines] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: user.id, completed: true },
      select: { lessonId: true },
    }),
    prisma.machineProgress.findMany({
      where: { userId: user.id, rootOwned: true },
      select: { machineId: true },
    }),
  ]);
  const lessonSet = new Set(doneLessons.map((l) => l.lessonId));
  const machineSet = new Set(rootedMachines.map((m) => m.machineId));

  const isDone = (i: (typeof path.items)[number]) =>
    i.type === "LESSON"
      ? !!i.lessonId && lessonSet.has(i.lessonId)
      : !!i.machineId && machineSet.has(i.machineId);

  const total = path.items.length;
  const done = path.items.filter(isDone).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/paths" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Paths
        </Link>
        {path.certification ? (
          <Link
            href={`/certs/${path.certification.slug}`}
            className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Award className="size-3.5" /> Prepares you for {path.certification.name}
          </Link>
        ) : null}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{path.title}</h1>
          <DifficultyBadge difficulty={path.difficulty} />
        </div>
        <p className="mt-1 text-muted-foreground">{path.description}</p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{done}/{total} complete</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      </div>

      <ol className="relative space-y-3">
        {/* continuous connector line, masked at each node by the dot's ring */}
        <span
          aria-hidden
          className="absolute left-[10px] top-5 bottom-5 w-0.5 -translate-x-1/2 bg-border"
        />
        {path.items.map((item) => {
          const complete = isDone(item);
          const isLesson = item.type === "LESSON" && item.lesson;
          const href = isLesson
            ? `/learn/${item.lesson!.module.slug}/${item.lesson!.slug}`
            : item.machine
              ? `/machines/${item.machine.slug}`
              : "#";
          const title = isLesson ? item.lesson!.title : item.machine?.name ?? "Step";
          const sub = isLesson ? item.lesson!.module.title : "Machine";

          return (
            <li key={item.id} className="relative flex items-center gap-4">
              <span
                className={cn(
                  "relative z-10 size-5 shrink-0 rounded-full ring-4 ring-background",
                  complete ? "bg-success" : "bg-muted-foreground/30",
                )}
              />
              <Link
                href={href}
                className="flex flex-1 items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
              >
                {isLesson ? (
                  <BookOpen className="size-5 shrink-0 text-info" />
                ) : (
                  <Server className="size-5 shrink-0 text-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                {complete ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground" />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
