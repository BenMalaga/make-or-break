import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewPostForm } from "@/components/community/new-post-form";

export const metadata: Metadata = { title: "New post - Community" };

export default async function SubmitPage(
  props: {
    searchParams: Promise<{ community?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  await requireUser();

  // Communities to choose from: everything, with the user's joined ones first.
  const communities = await prisma.community.findMany({
    orderBy: [{ memberCount: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/community"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Community
        </Link>
        <h1 className="text-2xl font-bold">New post</h1>
      </div>

      {communities.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No communities exist yet.{" "}
          <Link href="/community/create" className="font-medium text-primary hover:underline">
            Create one first.
          </Link>
        </div>
      ) : (
        <NewPostForm communities={communities} defaultCommunity={searchParams.community} />
      )}
    </div>
  );
}
