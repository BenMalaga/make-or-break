import { NextResponse } from "next/server";
import { getChallenge, checkAnswer } from "@/lib/challenges";

/**
 * POST /api/challenges/[slug]/submit  { answer: string }
 *
 * Judges a submitted answer server-side against the challenge's frontmatter
 * answer; the canonical answer never reaches the client. Nothing is recorded:
 * the browser's progress store owns attempts and solve state.
 */
export async function POST(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const challenge = getChallenge(slug);
  if (!challenge) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { answer?: unknown } | null;
  const submission = typeof body?.answer === "string" ? body.answer : "";
  if (!submission.trim()) {
    return NextResponse.json({ error: "Empty answer" }, { status: 400 });
  }

  const correct = checkAnswer(slug, submission) === true;
  // meta.points defaults to POINTS_BY_DIFFICULTY[difficulty]; frontmatter may override it.
  const points = correct ? challenge.meta.points : 0;
  return NextResponse.json({ correct, points });
}
