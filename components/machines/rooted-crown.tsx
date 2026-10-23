"use client";

import { Crown } from "lucide-react";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

/** Crown in the machine header once the progress store shows root captured. */
export function RootedCrown({ machineSlug }: { machineSlug: string }) {
  const flags = useProgress((s) => s.machines[machineSlug]?.flags);
  const hydrated = useProgressHydrated();
  if (!hydrated) return null;
  const rooted = Object.values(flags ?? {}).some((f) => f.kind === "ROOT");
  return rooted ? <Crown className="size-5 text-success" /> : null;
}
