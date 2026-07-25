import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Server, Crown, Lock, BookLock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readMachine, readMachineWalkthrough } from "@/lib/content/mdx";
import { Mdx } from "@/lib/content/render";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { TargetSetup } from "@/components/machines/target-setup";
import { TaskChecklist } from "@/components/machines/task-checklist";
import { HintList } from "@/components/machines/hint-list";
import { FlagSubmit } from "@/components/machines/flag-submit";
import { OS_LABEL, TARGET_TYPE_LABEL } from "@/lib/constants";

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const m = await prisma.machine.findUnique({ where: { slug: params.slug } });
  return { title: m?.name ?? "Machine" };
}

export default async function MachinePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const user = await requireUser();

  const machine = await prisma.machine.findUnique({
    where: { slug: params.slug },
    include: {
      tasks: { orderBy: { order: "asc" } },
      hints: { orderBy: { order: "asc" } },
      creator: { select: { username: true } },
    },
  });
  if (!machine) notFound();

  const [progress, taskDone, hintUnlocks] = await Promise.all([
    prisma.machineProgress.findUnique({
      where: { userId_machineId: { userId: user.id, machineId: machine.id } },
    }),
    prisma.machineTaskCompletion.findMany({
      where: { userId: user.id, task: { machineId: machine.id } },
      select: { taskId: true },
    }),
    prisma.hintUnlock.findMany({
      where: { userId: user.id, hint: { machineId: machine.id } },
      select: { hintId: true },
    }),
  ]);

  const doneSet = new Set(taskDone.map((t) => t.taskId));
  const unlockedSet = new Set(hintUnlocks.map((h) => h.hintId));
  const rooted = progress?.rootOwned ?? false;
  const canSeeWalkthrough = rooted || machine.retired;

  const raw = readMachine(machine.contentRef);
  const walkthrough = canSeeWalkthrough ? readMachineWalkthrough(machine.contentRef) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/machines" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Machines
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="size-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{machine.name}</h1>
              {rooted ? <Crown className="size-5 text-success" /> : null}
              <DifficultyBadge difficulty={machine.difficulty} />
            </div>
            <p className="mt-1 text-muted-foreground">{machine.tagline ?? machine.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{OS_LABEL[machine.os]}</span>
              <span>-</span>
              <span>{TARGET_TYPE_LABEL[machine.targetType]}</span>
              <span>-</span>
              <span className="font-medium text-primary">{machine.points} pts</span>
              {machine.creator ? (
                <>
                  <span>-</span>
                  <span>by {machine.creator.username}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {raw ? (
        <div className="text-[0.95rem]">
          <Mdx source={raw.body} />
        </div>
      ) : null}

      <TargetSetup machine={machine} />

      {machine.tasks.length ? (
        <TaskChecklist
          tasks={machine.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            done: doneSet.has(t.id),
          }))}
        />
      ) : null}

      <FlagSubmit
        machineId={machine.id}
        userOwned={progress?.userOwned ?? false}
        rootOwned={progress?.rootOwned ?? false}
      />

      {machine.hints.length ? (
        <HintList
          hints={machine.hints.map((h) => ({
            id: h.id,
            order: h.order,
            title: h.title,
            pointCost: h.pointCost,
            unlocked: unlockedSet.has(h.id),
            body: unlockedSet.has(h.id) ? h.body : null,
          }))}
        />
      ) : null}

      {/* Walkthrough - spoiler-gated server-side */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <BookLock className="size-5 text-primary" /> Walkthrough
        </h2>
        {canSeeWalkthrough ? (
          walkthrough ? (
            <div className="rounded-lg border bg-card p-5 text-[0.95rem]">
              <Mdx source={walkthrough} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No walkthrough written for this machine yet.</p>
          )
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            <Lock className="size-5 shrink-0" />
            The walkthrough unlocks once you capture root (or when the machine
            retires). No spoilers before then - try the hints first.
          </div>
        )}
      </section>
    </div>
  );
}
