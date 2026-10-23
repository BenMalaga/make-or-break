import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Server, BookLock } from "lucide-react";
import { listMachineFiles, readMachineWalkthrough } from "@/lib/content/mdx";
import { Mdx } from "@/lib/content/render";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { TargetSetup } from "@/components/machines/target-setup";
import { TaskChecklist } from "@/components/machines/task-checklist";
import { HintList } from "@/components/machines/hint-list";
import { FlagSubmit } from "@/components/machines/flag-submit";
import { RootedCrown } from "@/components/machines/rooted-crown";
import { WalkthroughGate } from "@/components/machines/walkthrough-gate";
import { OS_LABEL, TARGET_TYPE_LABEL } from "@/lib/constants";

/**
 * Everything on this page comes from the machine's MDX frontmatter plus the
 * browser's progress store; there is no database row behind a machine.
 */
function findMachine(slug: string) {
  return listMachineFiles().find((m) => m.slug === slug) ?? null;
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const machine = findMachine(params.slug);
  return { title: machine?.frontmatter.name ?? "Machine" };
}

export default async function MachinePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const machine = findMachine(params.slug);
  if (!machine) notFound();

  const fm = machine.frontmatter;
  const points = fm.flags.reduce((sum, f) => sum + (f.points ?? 0), 0);
  const walkthrough = readMachineWalkthrough(machine.contentRef);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/machines" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Machines
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="size-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{fm.name}</h1>
              <RootedCrown machineSlug={machine.slug} />
              <DifficultyBadge difficulty={fm.difficulty} />
            </div>
            <p className="mt-1 text-muted-foreground">{fm.tagline ?? fm.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{OS_LABEL[fm.os ?? "OTHER"]}</span>
              <span>-</span>
              <span>{TARGET_TYPE_LABEL[fm.targetType]}</span>
              <span>-</span>
              <span className="font-medium text-primary">{points} pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[0.95rem]">
        <Mdx source={machine.body} />
      </div>

      <TargetSetup machine={fm} />

      {fm.tasks?.length ? (
        <TaskChecklist
          machineSlug={machine.slug}
          tasks={fm.tasks.map((t) => ({
            // Store key: the task title (titles are unique within a machine).
            key: t.title,
            title: t.title,
            description: t.description,
          }))}
        />
      ) : null}

      <FlagSubmit machineSlug={machine.slug} />

      {fm.hints?.length ? (
        <HintList
          machineSlug={machine.slug}
          hints={fm.hints.map((h, i) => ({
            // Store key: the hint's frontmatter index (titles are optional).
            key: String(i),
            title: h.title,
            cost: h.cost ?? 0,
          }))}
        />
      ) : null}

      {/* Walkthrough - spoiler-gated by the store's rooted state */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <BookLock className="size-5 text-primary" /> Walkthrough
        </h2>
        <WalkthroughGate
          machineSlug={machine.slug}
          retired={Boolean(fm.retired)}
          hasWalkthrough={Boolean(walkthrough)}
        >
          {walkthrough ? <Mdx source={walkthrough} /> : null}
        </WalkthroughGate>
      </section>
    </div>
  );
}
