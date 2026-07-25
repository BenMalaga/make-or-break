"use client";

import { useState } from "react";
import { Lightbulb, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { unlockHint } from "@/lib/actions/machines";
import { Button } from "@/components/ui/button";

export interface HintItem {
  id: string;
  order: number;
  title: string | null;
  pointCost: number;
  unlocked: boolean;
  body: string | null; // present only if already unlocked
}

export function HintList({ hints }: { hints: HintItem[] }) {
  const [items, setItems] = useState(hints);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function reveal(id: string, cost: number) {
    if (cost > 0 && !window.confirm(`Reveal this hint for ${cost} points?`)) return;
    setLoadingId(id);
    const res = await unlockHint(id);
    setLoadingId(null);
    if (res.ok && "body" in res) {
      setItems((prev) => prev.map((h) => (h.id === id ? { ...h, unlocked: true, body: res.body ?? "" } : h)));
    } else {
      toast.error("Could not unlock hint.");
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-5 py-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Lightbulb className="size-4 text-primary" /> Hints
        </h3>
      </div>
      <ul className="divide-y divide-border/60">
        {items.map((h, i) => (
          <li key={h.id} className="px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{h.title ?? `Hint ${i + 1}`}</span>
              {!h.unlocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reveal(h.id, h.pointCost)}
                  disabled={loadingId === h.id}
                >
                  {loadingId === h.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Lock className="size-3.5" />
                  )}
                  {h.pointCost > 0 ? `Reveal (-${h.pointCost} pts)` : "Reveal"}
                </Button>
              ) : null}
            </div>
            {h.unlocked && h.body ? (
              <p className="mt-2 text-sm text-muted-foreground">{h.body}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
