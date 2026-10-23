"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { unlockHint as fetchHintBody } from "@/lib/actions/machines";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { Button } from "@/components/ui/button";

export interface HintItem {
  /** Stable store key: the hint's frontmatter index, as a string. */
  key: string;
  title?: string;
  cost: number;
}

/**
 * Progressive hints. Unlocked state lives in the progress store (key only);
 * the client spends the points there first and only then fetches the body
 * from the server, so locked hint text is never sent to the browser.
 */
export function HintList({
  machineSlug,
  hints,
}: {
  machineSlug: string;
  hints: HintItem[];
}) {
  const unlockedKeys = useProgress((s) => s.machines[machineSlug]?.hints);
  const unlockHint = useProgress((s) => s.unlockHint);
  const hydrated = useProgressHydrated();
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const fetched = useRef(new Set<string>());

  // Hints unlocked in an earlier session are known to the store by key only;
  // fetch their bodies once after hydration.
  useEffect(() => {
    if (!hydrated) return;
    for (const key of unlockedKeys ?? []) {
      if (fetched.current.has(key)) continue;
      fetched.current.add(key);
      void fetchHintBody(machineSlug, key).then((body) => {
        if (body != null) setBodies((b) => ({ ...b, [key]: body }));
      });
    }
  }, [hydrated, unlockedKeys, machineSlug]);

  async function reveal(key: string, cost: number) {
    if (cost > 0 && !window.confirm(`Reveal this hint for ${cost} points?`)) return;
    // The store checks the balance and deducts; only spend successes reach the server.
    if (!unlockHint(machineSlug, key, cost)) {
      toast.error("Not enough points for this hint.");
      return;
    }
    setLoadingKey(key);
    const body = await fetchHintBody(machineSlug, key);
    setLoadingKey(null);
    if (body == null) {
      toast.error("Could not unlock hint.");
      return;
    }
    setBodies((b) => ({ ...b, [key]: body }));
  }

  if (!hints.length) return null;

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-5 py-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Lightbulb className="size-4 text-primary" /> Hints
        </h3>
      </div>
      <ul className="divide-y divide-border/60">
        {hints.map((h, i) => {
          const unlocked =
            h.key in bodies || (hydrated && (unlockedKeys ?? []).includes(h.key));
          return (
            <li key={h.key} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{h.title ?? `Hint ${i + 1}`}</span>
                {!unlocked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reveal(h.key, h.cost)}
                    disabled={loadingKey === h.key}
                  >
                    {loadingKey === h.key ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                    {h.cost > 0 ? `Reveal (-${h.cost} pts)` : "Reveal"}
                  </Button>
                ) : null}
              </div>
              {unlocked && bodies[h.key] ? (
                <p className="mt-2 text-sm text-muted-foreground">{bodies[h.key]}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
