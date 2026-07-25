import Link from "next/link";
import type { Metadata } from "next";
import { FileText, FilePlus2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CommunityTabs } from "@/components/community/community-tabs";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Write-ups - Community" };

export default async function CommunityWriteupsPage() {
  const user = await requireUser();

  const [mine, published] = await Promise.all([
    prisma.writeup.findMany({
      where: { userId: user.id },
      include: { machine: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.writeup.findMany({
      where: { status: "PUBLISHED" },
      include: {
        machine: { select: { name: true } },
        user: { select: { username: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community"
        subtitle="Join communities, share what you build and break, and help each other out."
      />

      <CommunityTabs active="writeups" />

      <div className="max-w-3xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <FileText className="size-5 text-primary" /> Write-ups
            </h2>
            <p className="text-sm text-muted-foreground">
              Document how you owned a box, and read how others did. Writing your solve is the single
              best habit for actually learning.
            </p>
          </div>
          <Button asChild>
            <Link href="/writeups/new">
              <FilePlus2 className="size-4" /> Write one
            </Link>
          </Button>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Your write-ups</h3>
          {mine.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              You have not written any yet. Pick a machine and walk through your solve, recon to
              root.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {mine.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/writeups/${w.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{w.title}</p>
                      <p className="text-xs text-muted-foreground">{w.machine.name}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        w.status === "PUBLISHED"
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {w.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">From the community</h3>
          {published.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No published write-ups yet. Be the first.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {published.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/writeups/${w.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{w.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.machine.name} &middot; {w.user.username}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(w.updatedAt, { addSuffix: true })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
