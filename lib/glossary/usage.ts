import "server-only";
import { listLessonFiles } from "@/lib/content/mdx";
import { findTermIds } from "./match";

/**
 * Which lessons use which glossary term. Powers the "Appears in" links on a term
 * detail page, so a definition connects back to the lessons that teach it.
 *
 * Built by scanning lesson bodies with the same matcher the auto-wrap plugin
 * uses, so the two never disagree about what counts as a mention. SERVER ONLY
 * (reads the filesystem). Computed once per process and cached.
 */
export interface LessonRef {
  slug: string;
  title: string;
  module: string;
  moduleTitle: string;
  moduleOrder: number;
  order: number;
}

let cache: Map<string, LessonRef[]> | null = null;

function build(): Map<string, LessonRef[]> {
  const byTerm = new Map<string, LessonRef[]>();
  for (const lesson of listLessonFiles()) {
    const fm = lesson.frontmatter;
    const ref: LessonRef = {
      slug: lesson.slug,
      title: String(fm.title ?? lesson.slug),
      module: String(fm.module ?? ""),
      moduleTitle: String(fm.moduleTitle ?? fm.module ?? ""),
      moduleOrder: Number(fm.moduleOrder ?? 0),
      order: Number(fm.order ?? 0),
    };
    // Match against the title and body together.
    for (const id of findTermIds(`${ref.title}\n${lesson.body}`)) {
      const list = byTerm.get(id) ?? [];
      list.push(ref);
      byTerm.set(id, list);
    }
  }
  for (const list of byTerm.values()) {
    list.sort((a, b) => a.moduleOrder - b.moduleOrder || a.order - b.order);
  }
  return byTerm;
}

export function lessonsUsingTerm(id: string): LessonRef[] {
  cache ??= build();
  return cache.get(id) ?? [];
}

/** id -> number of lessons using it. Used for the count on glossary cards. */
export function termUsageCounts(): Record<string, number> {
  cache ??= build();
  const out: Record<string, number> = {};
  for (const [id, list] of cache.entries()) out[id] = list.length;
  return out;
}
