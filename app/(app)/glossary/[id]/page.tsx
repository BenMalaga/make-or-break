import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Hash } from "lucide-react";
import { glossaryEntry } from "@/lib/glossary";
import { lessonsUsingTerm } from "@/lib/glossary/usage";
import { FadeIn } from "@/components/motion/motion";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const entry = glossaryEntry(params.id);
  return { title: entry ? `${entry.term} - Glossary` : "Glossary" };
}

export default async function TermPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const entry = glossaryEntry(params.id);
  if (!entry) notFound();

  // Resolve seeAlso ids to entries, dropping any that no longer exist.
  const related = (entry.seeAlso ?? [])
    .map((id) => glossaryEntry(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const lessons = lessonsUsingTerm(entry.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <FadeIn>
        <Link
          href="/glossary"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Glossary
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{entry.term}</h1>
          <Badge variant="outline">{entry.categoryLabel}</Badge>
        </div>
        <p className="mt-3 text-lg leading-8 text-muted-foreground">{entry.definition}</p>
      </FadeIn>

      {related.length > 0 && (
        <FadeIn delay={0.05}>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Hash className="size-4 text-primary" /> Related terms
            </h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link key={r.id} href={`/glossary/${r.id}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/70">
                    {r.term}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="size-4 text-primary" /> Appears in
            {lessons.length > 0 ? (
              <span className="text-muted-foreground">({lessons.length})</span>
            ) : null}
          </h2>
          {lessons.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No lessons reference this term yet.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {lessons.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/learn/${l.module}/${l.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="font-medium">{l.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{l.moduleTitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </FadeIn>
    </div>
  );
}
