"use client";

import { useState } from "react";
import { ArrowRight, Check, X, Clock, Laptop, Server } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Open vs closed vs filtered from the scanner's point of view. Pick the port
 * state and see what a SYN probe gets back. Used via <Diagram type="ports" />.
 *
 * Attacker's eye: you send one SYN and read the reply. SYN-ACK means open,
 * come on in. RST means closed, something answered but nothing is listening.
 * Silence means filtered, a firewall is eating your probe and you learn nothing.
 */

type StateKey = "open" | "closed" | "filtered";

interface PortState {
  key: StateKey;
  label: string;
  reply: string;
  scannerSees: string;
  meaning: string;
  tone: "good" | "bad" | "muted";
  icon: React.ReactNode;
}

const STATES: PortState[] = [
  {
    key: "open",
    label: "Open",
    reply: "SYN-ACK",
    scannerSees: "SYN-ACK returned",
    meaning: "A service is listening. This is your way in. Fingerprint it next.",
    tone: "good",
    icon: <Check className="size-4" />,
  },
  {
    key: "closed",
    label: "Closed",
    reply: "RST",
    scannerSees: "RST returned",
    meaning: "The host is up but nothing listens on this port. Reachable, not useful.",
    tone: "bad",
    icon: <X className="size-4" />,
  },
  {
    key: "filtered",
    label: "Filtered",
    reply: "no response",
    scannerSees: "timeout, no packet",
    meaning: "A firewall drops the probe. You cannot tell open from closed. Slow and noisy to map.",
    tone: "muted",
    icon: <Clock className="size-4" />,
  },
];

export function PortStates() {
  const [active, setActive] = useState<StateKey>("open");
  const state = STATES.find((s) => s.key === active)!;
  const silent = state.key === "filtered";

  return (
    <div className="my-6 rounded-lg border bg-card p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {STATES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
              active === s.key ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent/40",
            )}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      <div className="rounded-md border bg-background p-3">
        <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Laptop className="size-4" /> Scanner
          </span>
          <span className="flex items-center gap-1.5">
            Target :443 <Server className="size-4" />
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
              <ArrowRight className="size-3.5" />
            </span>
            <span className="text-muted-foreground">probe</span>
            <code className="rounded bg-muted px-2 py-0.5">SYN</code>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 rotate-180 items-center justify-center rounded",
                silent ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              <ArrowRight className="size-3.5" />
            </span>
            <span className="text-muted-foreground">reply</span>
            <code
              className={cn(
                "rounded px-2 py-0.5",
                silent ? "bg-muted text-muted-foreground" : "bg-primary/10 font-semibold text-primary",
              )}
            >
              {state.reply}
            </code>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Scanner sees</dt>
          <dd className="font-mono">{state.scannerSees}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">What it means</dt>
          <dd className="text-muted-foreground">{state.meaning}</dd>
        </div>
      </dl>
    </div>
  );
}
