"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, ArrowUpRight, AlertTriangle } from "lucide-react";
import { setLessonNotes } from "@/lib/actions/progress";
import { cn } from "@/lib/utils";

/**
 * One editable note on the My Notes page. Edits save back to the same
 * LessonProgress.notes as the in-lesson panel, so the two stay in sync.
 */
export function NoteCard({
  lessonId,
  lessonTitle,
  moduleTitle,
  href,
  initialNotes,
}: {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  href: string;
  initialNotes: string;
}) {
  const [value, setValue] = useState(initialNotes);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(v: string) {
    setValue(v);
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await setLessonNotes(lessonId, v);
        setStatus("saved");
      } catch {
        // Never flip to "Saved" when the write failed: the note is not safe.
        setStatus("error");
      }
    }, 700);
  }

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
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 text-xs",
            status === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {status === "saving" ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving
            </>
          ) : status === "error" ? (
            <>
              <AlertTriangle className="size-3" /> Not saved, keep typing to retry
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
