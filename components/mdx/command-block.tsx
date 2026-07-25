"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandLine {
  cmd: string;
  /** Optional inline comment shown dimmed above/beside the command. */
  comment?: string;
}

/**
 * A multi-line command sequence with per-line copy and a "copy all" button.
 *
 * MDX usage:
 *   <CommandBlock title="Initial recon" commands={[
 *     { cmd: "export IP=10.10.10.5", comment: "target" },
 *     { cmd: "nmap -sVC -oN nmap.txt $IP" },
 *   ]} />
 */
export function CommandBlock({
  commands,
  title = "attacker@kali",
}: {
  commands: CommandLine[];
  title?: string;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function write(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function copyAll() {
    if (await write(commands.map((c) => c.cmd).join("\n"))) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    }
  }

  async function copyOne(i: number) {
    if (await write(commands[i].cmd)) {
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx((cur) => (cur === i ? null : cur)), 1500);
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Terminal className="size-3.5" />
          {title}
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {copiedAll ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          {copiedAll ? "Copied all" : "Copy all"}
        </button>
      </div>
      <div className="divide-y divide-border/60">
        {commands.map((line, i) => (
          <div key={i} className="group px-4 py-2">
            {line.comment ? (
              <div className="mb-0.5 font-mono text-xs text-muted-foreground/70"># {line.comment}</div>
            ) : null}
            <div className="flex items-start justify-between gap-2">
              <code className="scrollbar-thin overflow-x-auto font-mono text-sm">
                <span className="mr-2 select-none text-primary">$</span>
                {line.cmd}
              </code>
              <button
                type="button"
                onClick={() => copyOne(i)}
                className={cn(
                  "shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100",
                  copiedIdx === i && "opacity-100",
                )}
                aria-label="Copy line"
              >
                {copiedIdx === i ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
