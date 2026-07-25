import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { NewCommunityForm } from "@/components/community/new-community-form";

export const metadata: Metadata = { title: "Create a community" };

export default async function CreateCommunityPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/community"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Community
        </Link>
        <h1 className="text-2xl font-bold">Create a community</h1>
        <p className="text-muted-foreground">
          Start a space around any topic. You will be its first member.
        </p>
      </div>

      <NewCommunityForm />
    </div>
  );
}
