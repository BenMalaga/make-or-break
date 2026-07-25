import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Pencil, Server } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostBody } from "@/components/community/post-body";
import { Button } from "@/components/ui/button";

export async function generateMetadata(
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const w = await prisma.writeup.findUnique({ where: { id: params.id }, select: { title: true } });
  return { title: w ? `${w.title} - Write-ups` : "Write-ups" };
}

export default async function WriteupPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await requireUser();

  const writeup = await prisma.writeup.findUnique({
    where: { id: params.id },
    include: {
      machine: { select: { name: true, slug: true } },
      user: { select: { id: true, username: true } },
    },
  });
  if (!writeup) notFound();

  const isOwner = writeup.userId === user.id;
  // A draft is private to its author.
  if (writeup.status === "DRAFT" && !isOwner) notFound();

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/community/writeups"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Write-ups
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {writeup.status === "DRAFT" ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Draft
            </span>
          ) : null}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Server className="size-3.5" /> {writeup.machine.name}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{writeup.title}</h1>
        <p className="text-sm text-muted-foreground">
          by {writeup.user.username} &middot;{" "}
          {formatDistanceToNow(writeup.updatedAt, { addSuffix: true })}
        </p>
        {isOwner ? (
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link href={`/writeups/new?machine=${writeup.machineId}`}>
              <Pencil className="size-3.5" /> Edit
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="rounded-lg border bg-card p-5">
        <PostBody body={writeup.contentMdx} />
      </div>
    </article>
  );
}
