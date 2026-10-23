import { listLessonFiles } from "./mdx";
import type { LessonFrontmatter } from "./types";

/**
 * The module/lesson catalog, read straight from the MDX on disk. This replaces
 * the Module/Lesson database tables that content used to be seeded into: the
 * frontmatter was always the source of truth, so the DB copy was redundant.
 * Built once per server process and cached. Server only (node:fs upstream).
 */

export interface CatalogLesson {
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  objectives: string[];
  tags: string[];
  prerequisites: string[];
  order: number;
  moduleSlug: string;
  moduleTitle: string;
  moduleIcon: string;
  moduleOrder: number;
  contentRef: string;
}

export interface CatalogModule {
  slug: string;
  title: string;
  icon: string;
  order: number;
  lessonSlugs: string[];
}

interface Catalog {
  lessons: CatalogLesson[];
  bySlug: Map<string, CatalogLesson>;
  modules: CatalogModule[];
  byModuleSlug: Map<string, CatalogModule>;
}

let cache: Catalog | null = null;

function build(): Catalog {
  const files = listLessonFiles();
  const lessons: CatalogLesson[] = [];
  const moduleMap = new Map<string, CatalogModule>();

  for (const f of files) {
    const fm = f.frontmatter as LessonFrontmatter;
    if (fm.draft) continue;
    const moduleSlug = fm.module;
    const lesson: CatalogLesson = {
      slug: f.slug,
      title: fm.title,
      summary: fm.summary ?? "",
      estimatedMinutes: fm.estimatedMinutes ?? 15,
      objectives: fm.objectives ?? [],
      tags: fm.tags ?? [],
      prerequisites: fm.prerequisites ?? [],
      order: fm.order ?? 0,
      moduleSlug,
      moduleTitle: fm.moduleTitle ?? moduleSlug,
      moduleIcon: fm.moduleIcon ?? "BookOpen",
      moduleOrder: fm.moduleOrder ?? 500,
      contentRef: f.contentRef,
    };
    lessons.push(lesson);

    let mod = moduleMap.get(moduleSlug);
    if (!mod) {
      mod = {
        slug: moduleSlug,
        title: lesson.moduleTitle,
        icon: lesson.moduleIcon,
        order: lesson.moduleOrder,
        lessonSlugs: [],
      };
      moduleMap.set(moduleSlug, mod);
    }
    mod.lessonSlugs.push(lesson.slug);
  }

  lessons.sort(
    (a, b) =>
      a.moduleOrder - b.moduleOrder || a.order - b.order || a.title.localeCompare(b.title),
  );
  for (const mod of moduleMap.values()) {
    mod.lessonSlugs.sort((x, y) => {
      const lx = lessons.find((l) => l.slug === x)?.order ?? 0;
      const ly = lessons.find((l) => l.slug === y)?.order ?? 0;
      return lx - ly;
    });
  }
  const modules = [...moduleMap.values()].sort((a, b) => a.order - b.order);

  return {
    lessons,
    bySlug: new Map(lessons.map((l) => [l.slug, l])),
    modules,
    byModuleSlug: new Map(modules.map((m) => [m.slug, m])),
  };
}

export function getCatalog(): Catalog {
  if (!cache) cache = build();
  return cache;
}

export function catalogLessons(): CatalogLesson[] {
  return getCatalog().lessons;
}

export function catalogModules(): CatalogModule[] {
  return getCatalog().modules;
}

export function catalogLesson(slug: string): CatalogLesson | null {
  return getCatalog().bySlug.get(slug) ?? null;
}

export function catalogModule(slug: string): CatalogModule | null {
  return getCatalog().byModuleSlug.get(slug) ?? null;
}

export function catalogModuleLessons(moduleSlug: string): CatalogLesson[] {
  const mod = getCatalog().byModuleSlug.get(moduleSlug);
  if (!mod) return [];
  return mod.lessonSlugs
    .map((s) => getCatalog().bySlug.get(s))
    .filter((l): l is CatalogLesson => Boolean(l))
    .sort((a, b) => a.order - b.order);
}
