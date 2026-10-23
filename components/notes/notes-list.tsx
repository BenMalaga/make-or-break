"use client";

import Link from "next/link";
import { NoteCard } from "@/components/notes/note-card";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

export interface NotesLesson {
  slug: string;
  title: string;
  moduleTitle: string;
  href: string;
}

/**
 * The My Notes list. The server passes every catalog lesson; which ones have
 * notes lives only in the progress store, so this renders nothing until it has
 * rehydrated (an empty list before that would wrongly claim "no notes yet").
 */
export function NotesList({ lessons }: { lessons: NotesLesson[] }) {
  const hydrated = useProgressHydrated();
  const progress = useProgress((s) => s.lessons);

  if (!hydrated) return null;

  const withNotes = lessons.filter((l) => (progress[l.slug]?.notes ?? "").trim().length > 0);

  if (withNotes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No notes yet. Open a{" "}
        <Link href="/learn" className="font-medium text-primary hover:underline">
          lesson
        </Link>{" "}
        and use the notes button in its top-right corner. Anything you write shows up here.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {withNotes.map((l) => (
        <NoteCard
          key={l.slug}
          slug={l.slug}
          lessonTitle={l.title}
          moduleTitle={l.moduleTitle}
          href={l.href}
          initialNotes={progress[l.slug]?.notes ?? ""}
        />
      ))}
    </div>
  );
}
