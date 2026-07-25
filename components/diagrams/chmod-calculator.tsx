"use client";

import { useMemo, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Interactive chmod calculator. Toggle read/write/execute per owner/group/other
 * and read the octal mode plus the symbolic string. Used via
 * <Diagram type="chmod" />.
 *
 * Attacker's eye: a world-writable file (the "other" write bit) is a foothold.
 * A world-readable key file leaks. Watch the last triad.
 */

type Klass = "owner" | "group" | "other";
type Perm = "r" | "w" | "x";

const CLASSES: { key: Klass; label: string }[] = [
  { key: "owner", label: "Owner" },
  { key: "group", label: "Group" },
  { key: "other", label: "Other" },
];

const PERMS: { key: Perm; label: string; bit: number }[] = [
  { key: "r", label: "Read", bit: 4 },
  { key: "w", label: "Write", bit: 2 },
  { key: "x", label: "Execute", bit: 1 },
];

type State = Record<Klass, Record<Perm, boolean>>;

const INITIAL: State = {
  owner: { r: true, w: true, x: true },
  group: { r: true, w: false, x: true },
  other: { r: true, w: false, x: true },
};

export function ChmodCalculator() {
  const [state, setState] = useState<State>(INITIAL);

  const { octal, symbolic, worldWritable } = useMemo(() => {
    let sym = "";
    const digits: number[] = [];
    for (const c of CLASSES) {
      let digit = 0;
      for (const p of PERMS) {
        const on = state[c.key][p.key];
        digit += on ? p.bit : 0;
        sym += on ? p.key : "-";
      }
      digits.push(digit);
    }
    return {
      octal: digits.join(""),
      symbolic: sym,
      worldWritable: state.other.w,
    };
  }, [state]);

  const toggle = (k: Klass, p: Perm) =>
    setState((s) => ({ ...s, [k]: { ...s[k], [p]: !s[k][p] } }));

  return (
    <div className="my-6 rounded-lg border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {CLASSES.map((c) => (
          <div key={c.key} className="rounded-md border p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {c.label}
            </div>
            <div className="space-y-1.5">
              {PERMS.map((p) => {
                const on = state[c.key][p.key];
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggle(c.key, p.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors",
                      on
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/40 hover:bg-accent/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded font-mono text-xs font-bold",
                        on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {p.key}
                    </span>
                    <span className="font-medium">{p.label}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{p.bit}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 bg-card px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Numeric mode</span>
          <span className="font-mono text-lg font-bold text-primary">{octal}</span>
        </div>
        <div className="flex items-center justify-between gap-3 bg-card px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Symbolic</span>
          <span className="font-mono text-lg font-bold">{symbolic}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {worldWritable ? (
          <>
            <Unlock className="size-4 shrink-0 text-destructive" />
            <span className="text-destructive">
              World-writable. Anyone on the box can overwrite this file. Prime persistence target.
            </span>
          </>
        ) : (
          <>
            <Lock className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              Run <code className="font-mono">chmod {octal} file</code> to set these bits.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
