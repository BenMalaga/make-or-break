import type { Metadata } from "next";
import { ALL_TERMS, CATEGORIES } from "@/lib/glossary";
import { termUsageCounts } from "@/lib/glossary/usage";
import { FadeIn } from "@/components/motion/motion";
import { PageHeader } from "@/components/layout/page-header";
import { GlossaryBrowser } from "@/components/glossary/glossary-browser";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Every term the courses use, defined in one place.",
};

export default function GlossaryPage() {
  const categories = CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    count: Object.keys(c.module).length,
  })).filter((c) => c.count > 0);

  const counts = termUsageCounts();
  const entries = ALL_TERMS.map((e) => ({ ...e, usageCount: counts[e.id] ?? 0 }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Glossary"
        subtitle="Every term the lessons use, defined in one place. Anything here also expands inline the first time a lesson uses it, so you never have to leave a page to find out what a word means."
      />
      <FadeIn delay={0.05}>
        <GlossaryBrowser entries={entries} categories={categories} />
      </FadeIn>
    </div>
  );
}
