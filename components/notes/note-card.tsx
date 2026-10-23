"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, ArrowUpRight } from "lucide-react";
import { useProgress } from "@/lib/progress/store";

/**
 * One editable note on the My Notes page. Edits write through to the progress
 * store, the same place the in-lesson panel persists, so the two stay in sync.
 */
export function NoteCard({
  slug,
  lessonTitle,
  moduleTitle,
  href,
  initialNotes,
}: {
  slug: string;
  lessonTitle: string;
  moduleTitle: string;
  href: string;
  initialNotes: string;
}) {
  const [value, setValue] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  function onChange(v: string) {
    setValue(v);
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      useProgress.getState().setNotes(slug, v);
      setSaving(false);
    }, 700);
  }

  // Flush a pending debounce so a quick navigate cannot drop the note.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        useProgress.getState().setNotes(slug, valueRef.current);
      }
    },
    [slug],
  );

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="min-w-0">
          <Link href={href} className="flex items-center gap-1 font-medium hover:text-primary">
            <span className="truncate">{lessonTitle}</span>
            <ArrowUpRight className="size-3.5 shrink-0" />
          </Link>
          <p className="text-xs text-muted-foreground">{moduleTitle}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          {saving ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving
            </>
          ) : (
            <>
              <Check className="size-3 text-success" /> Saved
            </>
          )}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="scrollbar-thin w-full resize-y rounded-b-lg bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
    </div>
  );
}
