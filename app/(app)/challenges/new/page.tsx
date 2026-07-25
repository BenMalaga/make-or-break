import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ChallengeForm } from "@/components/challenges/challenge-form";

export const metadata: Metadata = { title: "Create a challenge" };

export default async function NewChallengePage() {
  await requireUser();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/learn?view=challenges"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Challenges
        </Link>
        <PageHeader
          title="Create a challenge"
          subtitle="Write a puzzle or capture-the-flag for everyone to solve. It shows up in the Challenges list under your name; the answer is stored as a hash, never revealed."
        />
      </div>

      <ChallengeForm />
    </div>
  );
}
