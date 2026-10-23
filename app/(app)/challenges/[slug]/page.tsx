import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChallenge } from "@/lib/challenges";
import { Mdx } from "@/lib/content/render";
import { ChallengeWorkspace } from "@/components/challenges/challenge-workspace";

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const challenge = getChallenge(params.slug);
  if (!challenge) return { title: "Challenge" };
  return {
    title: `${challenge.meta.title} - Challenges`,
    description: challenge.meta.summary,
  };
}

export default async function ChallengePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const challenge = getChallenge(params.slug);
  if (!challenge) notFound();

  const description = (
    <Mdx source={challenge.body} autoWrapTerms={challenge.meta.track === "break"} />
  );

  return <ChallengeWorkspace challenge={challenge.meta} description={description} />;
}
