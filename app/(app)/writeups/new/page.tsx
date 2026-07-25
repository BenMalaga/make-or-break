import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { submitWriteup } from "@/lib/actions/writeups";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "New write-up" };

export default async function NewWriteupPage(
  props: {
    searchParams: Promise<{ machine?: string; error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const user = await requireUser();
  const machines = await prisma.machine.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  // The "Edit" button links here with ?machine=, and submitWriteup upserts by
  // (user, machine). Pre-fill the existing write-up so a save updates it instead
  // of silently blanking the content and unpublishing it.
  const existing = searchParams.machine
    ? await prisma.writeup.findFirst({
        where: { userId: user.id, machineId: searchParams.machine },
        select: { title: true, contentMdx: true, status: true, machineId: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/community/writeups"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Write-ups
        </Link>
        <h1 className="text-2xl font-bold">{existing ? "Edit write-up" : "New write-up"}</h1>
      </div>
      {searchParams.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" />
          {searchParams.error}
        </div>
      ) : null}
      {machines.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No machines available to write about yet.
        </div>
      ) : (
        <form action={submitWriteup} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="machineId" className="text-sm font-medium">
              Machine
            </label>
            {existing ? (
              // Locked while editing: changing it would target a different
              // machine's write-up.
              (<>
                <input type="hidden" name="machineId" value={existing.machineId} />
                <p className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                  {machines.find((m) => m.id === existing.machineId)?.name ?? "This machine"}
                </p>
              </>)
            ) : (
              <select
                id="machineId"
                name="machineId"
                defaultValue={searchParams.machine ?? machines[0].id}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              maxLength={160}
              defaultValue={existing?.title ?? ""}
              placeholder="Rooting Blue: SMB to SYSTEM"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="body" className="text-sm font-medium">
              Write-up
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={16}
              defaultValue={existing?.contentMdx ?? ""}
              placeholder="Walk through your solve, recon to root. Wrap commands and output in triple backticks (```) to embed them."
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Use ```bash for a terminal block, ```python for code, or `backticks` inline.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="publish"
              defaultChecked={existing?.status === "PUBLISHED"}
              className="size-4 rounded border-input"
            />
            Publish to the community now (otherwise it saves as a draft)
          </label>

          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost">
              <Link href="/community/writeups">Cancel</Link>
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}
    </div>
  );
}
