"use client";

import { useState } from "react";
import { Laptop, Router, Globe, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Source NAT walkthrough: a private host reaches the internet through a gateway
 * that rewrites the source IP and port, then reverses the swap on the reply.
 * Toggle direction to watch the translation table do its job.
 * Used via <Diagram type="nat-path" />.
 *
 * Attacker's eye: from the internet you never see the private host. You see the
 * gateway's public IP and an ephemeral port. The private 10.x address is hidden
 * behind that mapping, which is also why unsolicited inbound traffic has nowhere
 * to land unless a port is forwarded.
 */

const PRIVATE = "10.0.0.5:51820";
const PUBLIC = "203.0.113.7:40311";
const DEST = "93.184.216.34:443";

type Dir = "out" | "in";

export function NatPath() {
  const [dir, setDir] = useState<Dir>("out");
  const outbound = dir === "out";

  return (
    <div className="my-6 rounded-lg border bg-card p-4">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setDir("out")}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
            outbound ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent/40",
          )}
        >
          <ArrowRight className="size-3.5" /> Outbound
        </button>
        <button
          type="button"
          onClick={() => setDir("in")}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
            !outbound ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent/40",
          )}
        >
          <ArrowLeft className="size-3.5" /> Reply
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <Node icon={<Laptop className="size-5" />} label="Private host" addr={PRIVATE} />
        <Hop dir={dir} side="left" />
        <Node icon={<Router className="size-5" />} label="NAT gateway" addr="translation table" highlight />
        <Hop dir={dir} side="right" />
        <Node icon={<Globe className="size-5" />} label="Internet" addr={DEST} />
      </div>

      <div className="mt-4 rounded-md border bg-background p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Source rewrite {outbound ? "(out)" : "(back in)"}
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {outbound ? (
            <>
              <code className="rounded bg-muted px-2 py-1">src {PRIVATE}</code>
              <ArrowRight className="size-4 text-primary" />
              <code className="rounded bg-primary/10 px-2 py-1 font-semibold text-primary">
                src {PUBLIC}
              </code>
              <span className="text-muted-foreground">dst {DEST}</span>
            </>
          ) : (
            <>
              <code className="rounded bg-muted px-2 py-1">dst {PUBLIC}</code>
              <ArrowRight className="size-4 text-primary" />
              <code className="rounded bg-primary/10 px-2 py-1 font-semibold text-primary">
                dst {PRIVATE}
              </code>
              <span className="text-muted-foreground">src {DEST}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Node({
  icon,
  label,
  addr,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  addr: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-md border p-2 text-center sm:p-3",
        highlight && "border-primary bg-primary/5",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-md",
          highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="text-xs font-medium">{label}</span>
      <span className="break-all font-mono text-[10px] leading-tight text-muted-foreground">{addr}</span>
    </div>
  );
}

function Hop({ dir, side }: { dir: Dir; side: "left" | "right" }) {
  // Outbound flows left to right; a reply flows right to left.
  const pointsRight = dir === "out";
  return (
    <span className="flex items-center justify-center text-primary">
      {pointsRight ? (
        <ArrowRight className={cn("size-4 shrink-0", side === "left" && "opacity-100")} />
      ) : (
        <ArrowLeft className="size-4 shrink-0" />
      )}
    </span>
  );
}
