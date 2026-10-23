import type { Metadata } from "next";
import { listMachineFiles } from "@/lib/content/mdx";
import { PageHeader } from "@/components/layout/page-header";
import { MachinesGrid } from "@/components/machines/machines-grid";

export const metadata: Metadata = { title: "Machines" };

const DIFF_ORDER = { EASY: 0, MEDIUM: 1, HARD: 2, INSANE: 3 } as const;

export default function MachinesPage() {
  // Content comes straight from MDX frontmatter; owned/rooted state is
  // overlaid by the client grid from the progress store.
  const machines = listMachineFiles()
    .filter((m) => !m.frontmatter.draft)
    .sort(
      (a, b) =>
        DIFF_ORDER[a.frontmatter.difficulty] - DIFF_ORDER[b.frontmatter.difficulty] ||
        a.frontmatter.name.localeCompare(b.frontmatter.name),
    )
    .map((m) => ({
      slug: m.slug,
      name: m.frontmatter.name,
      tagline: m.frontmatter.tagline ?? m.frontmatter.description,
      difficulty: m.frontmatter.difficulty,
      tags: m.frontmatter.tags ?? [],
      os: m.frontmatter.os,
      targetType: m.frontmatter.targetType,
      points: m.frontmatter.flags.reduce((sum, f) => sum + (f.points ?? 0), 0),
      flags: m.frontmatter.flags.map((f) => ({ label: f.label, kind: f.type })),
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Machines"
        subtitle="Enumerate, foothold, escalate, submit flags. Every target runs on your own hardware."
      />

      {machines.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No machines are available yet. New boxes are on the way, check back soon.
        </div>
      ) : (
        <MachinesGrid machines={machines} />
      )}
    </div>
  );
}
