import type { Metadata } from "next";
import { DashboardView, type DashboardProps } from "@/components/dashboard/dashboard-view";
import { catalogLessons, catalogModules } from "@/lib/content/catalog";
import { listMachineFiles } from "@/lib/content/mdx";
import { getTodayDrop } from "@/lib/actions/daily";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Server wrapper: reads content from disk and passes plain serializable props.
 * All progress comes from the client store inside DashboardView.
 */
export default async function DashboardPage() {
  const lessons = catalogLessons().map((l) => ({
    slug: l.slug,
    title: l.title,
    tags: l.tags,
    moduleSlug: l.moduleSlug,
  }));
  const modules = catalogModules().map((m) => ({ slug: m.slug, title: m.title }));
  // Machine tags feed the skill radar; drafts are not shown anywhere.
  const machineTags = listMachineFiles()
    .filter((m) => !m.frontmatter.draft)
    .map((m) => ({ slug: m.slug, tags: m.frontmatter.tags ?? [] }));
  const drop = await getTodayDrop();

  const props: DashboardProps = {
    lessons,
    modules,
    machineTags,
    drop: drop
      ? { dateKey: drop.dateKey, dropNumber: drop.dropNumber, title: drop.meta.title }
      : null,
  };
  return <DashboardView {...props} />;
}
