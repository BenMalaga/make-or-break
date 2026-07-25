import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChallengeAnySource } from "@/lib/challenges";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Mdx } from "@/lib/content/render";
import { PostBody } from "@/components/community/post-body";
import { ChallengeWorkspace } from "@/components/challenges/challenge-workspace";

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const challenge = await getChallengeAnySource(params.slug);
  if (!challenge) return { title: "Challenge" };
  return {
    title: `${challenge.meta.title} - Challenges`,
    description: challenge.meta.summary,
  };
}

export default async function ChallengePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const challenge = await getChallengeAnySource(params.slug);
  if (!challenge) notFound();

  const userId = await currentUserId();
  let solved = false;
  let voted = false;
  if (userId) {
    const s = await prisma.challengeSolve.findUnique({
      where: { userId_slug: { userId, slug: params.slug } },
    });
    solved = s?.solved ?? false;
    if (challenge.source === "db") {
      const cv = await prisma.challengeVote.findFirst({
        where: { userId, challenge: { slug: params.slug } },
        select: { id: true },
      });
      voted = !!cv;
    }
  }

  const commentRows = await prisma.challengeComment.findMany({
    where: { slug: params.slug },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { username: true } } },
  });
  const comments = commentRows.map((c) => ({
    id: c.id,
    body: c.body,
    author: c.author?.username ?? "someone",
    createdAt: c.createdAt.toISOString(),
  }));

  // Official challenge bodies are first-party MDX. Community bodies are user
  // markdown and must render through the safe PostBody renderer.
  const description =
    challenge.source === "file" ? (
      <Mdx source={challenge.body} autoWrapTerms={challenge.meta.track === "break"} />
    ) : (
      <div className="mdx-content">
        <PostBody body={challenge.body} />
      </div>
    );

  return (
    <ChallengeWorkspace
      challenge={challenge.meta}
      initialSolved={solved}
      initialVoted={voted}
      comments={comments}
      description={description}
    />
  );
}
