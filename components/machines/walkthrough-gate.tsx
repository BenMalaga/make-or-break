"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

/**
 * Spoiler gate for the machine walkthrough. The rendered walkthrough arrives
 * from the server page as children; it only becomes visible once the progress
 * store shows root captured (or the machine is retired, which is known up
 * front and needs no hydration wait).
 */
export function WalkthroughGate({
  machineSlug,
  retired,
  hasWalkthrough,
  children,
}: {
  machineSlug: string;
  retired: boolean;
  hasWalkthrough: boolean;
  children: ReactNode;
}) {
  const flags = useProgress((s) => s.machines[machineSlug]?.flags);
  const hydrated = useProgressHydrated();
  const rooted =
    hydrated && Object.values(flags ?? {}).some((f) => f.kind === "ROOT");

  if (retired || rooted) {
    return hasWalkthrough ? (
      <div className="rounded-lg border bg-card p-5 text-[0.95rem]">{children}</div>
    ) : (
      <p className="text-sm text-muted-foreground">No walkthrough written for this machine yet.</p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
      <Lock className="size-5 shrink-0" />
      The walkthrough unlocks once you capture root (or when the machine
      retires). No spoilers before then - try the hints first.
    </div>
  );
}
