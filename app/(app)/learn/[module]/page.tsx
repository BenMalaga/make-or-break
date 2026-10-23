import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalogModule, catalogModuleLessons } from "@/lib/content/catalog";
import { ModuleLessons } from "@/components/learn/module-lessons";

export async function generateMetadata(props: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  return { title: catalogModule(params.module)?.title ?? "Module" };
}

export default async function ModulePage(props: { params: Promise<{ module: string }> }) {
  const params = await props.params;
  const mod = catalogModule(params.module);
  if (!mod) notFound();

  const lessons = catalogModuleLessons(params.module);

  return (
    <ModuleLessons
      moduleSlug={mod.slug}
      title={mod.title}
      // The first lesson's summary doubles as the module description, as the old
      // seed did when it copied content into the database.
      description={lessons[0]?.summary || mod.title}
      icon={mod.icon}
      lessons={lessons.map((l) => ({
        slug: l.slug,
        title: l.title,
        summary: l.summary,
        estimatedMinutes: l.estimatedMinutes,
      }))}
    />
  );
}
