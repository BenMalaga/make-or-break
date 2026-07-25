"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Collapsible "what you should see" block, so the learner can compare their
 * real VM output against a reference without it dominating the page.
 *
 * MDX usage:
 *   <ExpectedOutput label="Expected nmap output">
 *   ```
 *   22/tcp open ssh
 *   80/tcp open http
 *   ```
 *   </ExpectedOutput>
 */
export function ExpectedOutput({
  label = "Expected output",
  children,
  defaultOpen = false,
}: {
  label?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="my-4 overflow-hidden rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent/50"
      >
        <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} />
        <Eye className="size-4 text-muted-foreground" />
        {label}
      </button>
      {open ? (
        <div className="scrollbar-thin overflow-x-auto border-t bg-muted/20 px-4 py-3 text-sm [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0">
          {children}
        </div>
      ) : null}
    </div>
  );
}
