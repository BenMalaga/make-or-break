import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { NoteCard } from "@/components/notes/note-card";

export const metadata: Metadata = {
  title: "My Notes",
  description: "Everything you have noted while learning, in one place.",
};

export default async function NotesPage() {
  const user = await requireUser();

  const rows = await prisma.lessonProgress.findMany({
    where: { userId: user.id, NOT: { notes: null } },
    include: {
      lesson: {
        select: { title: true, slug: true, module: { select: { slug: true, title: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  const notes = rows.filter((r) => (r.notes ?? "").trim().length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Notes"
        subtitle="Everything you have jotted down while learning, gathered in one place. Edit here or in the lesson; they stay in sync."
      />

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No notes yet. Open a{" "}
          <Link href="/learn" className="font-medium text-primary hover:underline">
            lesson
          </Link>{" "}
          and use the notes button in its top-right corner. Anything you write shows up here.
        </div>
      ) : (
        <div className="max-w-3xl space-y-4">
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              lessonId={n.lessonId}
              lessonTitle={n.lesson.title}
              moduleTitle={n.lesson.module.title}
              href={`/learn/${n.lesson.module.slug}/${n.lesson.slug}`}
              initialNotes={n.notes ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
