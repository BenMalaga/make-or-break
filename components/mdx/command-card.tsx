"use client";

import { useState } from "react";
import { Check, Copy, Terminal, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The primary hands-on primitive: a single command in a styled block with
 * one-click copy + an optional explanation. The learner copies it and runs it
 * in their own Kali/attacker box.
 *
 * MDX usage:
 *   <CommandCard command="nmap -sVC -oN nmap.txt 10.10.10.5" explain="Service + default-script scan." />
 */
export function CommandCard({
  command,
  explain,
  title = "attacker@kali",
  danger = false,
}: {
  command: string;
  explain?: string;
  title?: string;
  danger?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; no-op */
    }
  }

  return (
    <div
      className={cn(
        "my-4 overflow-hidden rounded-lg border bg-card",
        danger && "border-destructive/50",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {danger ? (
            <TriangleAlert className="size-3.5 text-destructive" />
          ) : (
            <Terminal className="size-3.5" />
          )}
          {title}
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Copy command"
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="scrollbar-thin overflow-x-auto px-4 py-3">
        <code className="font-mono text-sm">
          <span className="mr-2 select-none text-primary">$</span>
          {command}
        </code>
      </pre>
      {explain ? (
        <div className="border-t px-4 py-2 text-xs leading-relaxed text-muted-foreground">
          {explain}
        </div>
      ) : null}
    </div>
  );
}
