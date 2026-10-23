"use client";

import Link from "next/link";
import { Crown, Server, Target } from "lucide-react";
import type { Difficulty, MachineOS, TargetType } from "@/lib/content/types";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { OS_LABEL, TARGET_TYPE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { StaggerGrid, StaggerItem } from "@/components/motion/motion";

export interface MachineCard {
  slug: string;
  name: string;
  tagline: string;
  difficulty: Difficulty;
  tags: string[];
  os?: MachineOS;
  targetType: TargetType;
  points: number;
  flags: { label: string; kind: "USER" | "ROOT" }[];
}

/**
 * Machine cards with owned/rooted state overlaid from the progress store.
 * Neutral (nothing owned) until the store hydrates, so SSR markup matches.
 */
export function MachinesGrid({ machines }: { machines: MachineCard[] }) {
  const progress = useProgress((s) => s.machines);
  const hydrated = useProgressHydrated();

  const rootedOf = (slug: string) =>
    hydrated
      ? Object.values(progress[slug]?.flags ?? {}).some((f) => f.kind === "ROOT")
      : false;

  return (
    <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {machines.map((m) => {
        const rooted = rootedOf(m.slug);
        return (
          <StaggerItem key={m.slug} className="flex">
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
                {m.tagline}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {m.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>{OS_LABEL[m.os ?? "OTHER"]} - {TARGET_TYPE_LABEL[m.targetType]}</span>
                <span className="flex items-center gap-1 font-medium text-primary">
                  <Target className="size-3" /> {m.points}
                </span>
              </div>
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerGrid>
  );
}
