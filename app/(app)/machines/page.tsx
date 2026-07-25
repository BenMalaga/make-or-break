import Link from "next/link";
import type { Metadata } from "next";
import { Server, Crown, Users, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { OS_LABEL, TARGET_TYPE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { StaggerGrid, StaggerItem } from "@/components/motion/motion";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Machines" };

const DIFF_ORDER = { EASY: 0, MEDIUM: 1, HARD: 2, INSANE: 3 } as const;

export default async function MachinesPage() {
  const user = await requireUser();
  const [machines, progress] = await Promise.all([
    prisma.machine.findMany({
      where: { status: "PUBLISHED" },
      include: { _count: { select: { flags: true } } },
    }),
    prisma.machineProgress.findMany({
      where: { userId: user.id },
      select: { machineId: true, userOwned: true, rootOwned: true },
    }),
  ]);
  const owned = new Map(progress.map((p) => [p.machineId, p]));
  const sorted = [...machines].sort(
    (a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] || a.name.localeCompare(b.name),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Machines"
        subtitle="Enumerate, foothold, escalate, submit flags. Every target runs on your own hardware."
      />

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No machines are available yet. New boxes are on the way, check back soon.
        </div>
      ) : (
        <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => {
            const p = owned.get(m.id);
            const rooted = p?.rootOwned ?? false;
            return (
              <StaggerItem key={m.id} className="flex">
              <Link
                href={`/machines/${m.slug}`}
                className={cn(
                  "hover-lift group flex w-full flex-col rounded-lg border bg-card p-5",
                  rooted && "border-success/40",
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Server className="size-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {rooted ? <Crown className="size-4 text-success" /> : null}
                    <DifficultyBadge difficulty={m.difficulty} />
                  </div>
                </div>
                <h3 className="font-semibold">{m.name}</h3>
                <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {m.tagline ?? m.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span>{OS_LABEL[m.os]} - {TARGET_TYPE_LABEL[m.targetType]}</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="size-3" /> {m.ownsCount}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <Target className="size-3" /> {m.points}
                    </span>
                  </span>
                </div>
              </Link>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      )}
    </div>
  );
}
