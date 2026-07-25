"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * The interactive half of <Term>. Receives an already-resolved definition, so
 * a lesson only ships the terms it actually uses instead of the whole glossary.
 * Use <Term> in MDX, not this.
 */
export function TermPopover({
  id,
  term,
  definition,
  related,
  children,
}: {
  id: string;
  term: string;
  definition: string;
  related: string[];
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Definition of ${term}`}
          className="cursor-help font-medium text-foreground underline decoration-primary/60 decoration-dotted underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          {children}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 space-y-1.5">
        <p className="font-mono text-xs uppercase tracking-wider text-primary">{term}</p>
        <p className="text-sm leading-6 text-muted-foreground">{definition}</p>
        {related.length > 0 && (
          <p className="text-xs text-muted-foreground/80">See also: {related.join(", ")}</p>
        )}
        <Link
          href={`/glossary/${id}`}
          className="inline-flex items-center gap-1 border-t pt-1.5 text-xs font-medium text-primary hover:underline"
        >
          Full entry and related lessons
          <ArrowUpRight className="size-3" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
