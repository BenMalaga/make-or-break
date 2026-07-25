"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, RotateCcw, SkipForward, Laptop, Server } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stepped TCP three-way handshake: SYN -> SYN-ACK -> ACK, then ESTABLISHED.
 * Next advances one segment, Reset drops back to nothing on the wire.
 * Used via <Diagram type="tcp-handshake" />.
 *
 * Attacker's eye: a SYN scan sends step 1 and reads the reply. A SYN-ACK back
 * means the port is open. You never complete step 3, so the connection never
 * fully lands in the app's logs.
 */

interface Step {
  flag: string;
  dir: "c2s" | "s2c";
  seq: string;
  note: string;
}

const STEPS: Step[] = [
  { flag: "SYN", dir: "c2s", seq: "seq=x", note: "Client asks to open. Picks a random initial sequence number." },
  { flag: "SYN-ACK", dir: "s2c", seq: "seq=y, ack=x+1", note: "Server agrees, sends its own sequence, acknowledges yours." },
  { flag: "ACK", dir: "c2s", seq: "ack=y+1", note: "Client confirms. The socket is now ESTABLISHED, data can flow." },
];

export function TcpHandshake() {
  const [step, setStep] = useState(0); // 0 = nothing sent yet, 1..3 = segments delivered
  const established = step >= 3;

  return (
    <div className="my-6 rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Laptop className="size-4" /> Client
        </span>
        <span className="flex items-center gap-1.5">
          Server <Server className="size-4" />
        </span>
      </div>

      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const sent = step > i;
          const isC2S = s.dir === "c2s";
          return (
            <div
              key={s.flag}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 transition-all",
                sent ? "border-primary bg-primary/10 opacity-100" : "opacity-40",
                !isC2S && "flex-row-reverse text-right",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-md",
                  sent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {isC2S ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
              </span>
              <div className={cn("min-w-0 flex-1", !isC2S && "flex flex-col items-end")}>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-bold">{s.flag}</span>
                  <span className="font-mono text-xs text-muted-foreground">{s.seq}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-xs font-semibold",
            established ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {established ? "ESTABLISHED" : step === 0 ? "CLOSED" : "SYN_SENT / SYN_RECV"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(0)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent/40"
          >
            <RotateCcw className="size-4" /> Reset
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            disabled={established}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SkipForward className="size-4" /> Next
          </button>
        </div>
      </div>
    </div>
  );
}
