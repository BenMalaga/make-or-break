import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalogLesson } from "@/lib/content/catalog";
import { listMachineFiles, listPathFiles } from "@/lib/content/mdx";
import { PathItems, type PathItemData } from "@/components/learn/path-items";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const p = listPathFiles().find((f) => f.slug === params.slug);
  return { title: p?.frontmatter.title ?? "Path" };
}

export default async function PathPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const raw = listPathFiles().find((f) => f.slug === params.slug);
  if (!raw) notFound();

  // Machine items resolve against the machine MDX by slug; lessons against the
  // catalog. Items that no longer exist are skipped rather than rendered dead.
  const machineByName = new Map(listMachineFiles().map((m) => [m.slug, m.frontmatter]));
  const items: PathItemData[] = [];
  for (const it of raw.frontmatter.items) {
    if (it.type === "LESSON") {
      const l = catalogLesson(it.slug);
      if (l) {
        items.push({
          kind: "lesson",
          slug: l.slug,
          title: l.title,
          sub: l.moduleTitle,
          href: `/learn/${l.moduleSlug}/${l.slug}`,
        });
      }
    } else {
      const m = machineByName.get(it.slug);
      if (m) {
        items.push({
          kind: "machine",
          slug: it.slug,
          title: m.name,
          sub: "Machine",
          href: `/machines/${it.slug}`,
          difficulty: m.difficulty,
        });
      }
    }
  }

  return (
    <PathItems
      title={raw.frontmatter.title}
      description={raw.frontmatter.description}
      difficulty={raw.frontmatter.difficulty}
      items={items}
    />
  );
}
