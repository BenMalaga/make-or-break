import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NotesList } from "@/components/notes/notes-list";
import { catalogLessons } from "@/lib/content/catalog";

export const metadata: Metadata = {
  title: "My Notes",
  description: "Everything you have noted while learning, in one place.",
};

export default function NotesPage() {
  // Which lessons have notes lives in the client store; the server only
  // supplies the catalog entries so a note can show its title and module.
  const lessons = catalogLessons().map((l) => ({
    slug: l.slug,
    title: l.title,
    moduleTitle: l.moduleTitle,
    href: `/learn/${l.moduleSlug}/${l.slug}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Notes"
        subtitle="Everything you have jotted down while learning, gathered in one place. Edit here or in the lesson; they stay in sync."
      />
      <NotesList lessons={lessons} />
    </div>
  );
}
