import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { listCerts } from "@/lib/content/certs";
import { selectExamQuestions, type ExamMode } from "@/lib/actions/exams";
import { ExamRunner } from "@/components/exams/exam-runner";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Exam" };

export default async function ExamPage(
  props: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ mode?: string; count?: string; domain?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const loaded = listCerts().find((c) => c.cert.slug === params.slug);
  if (!loaded) notFound();
  const cert = loaded.cert;

  const mode: ExamMode =
    searchParams.mode === "domain"
      ? "domain"
      : searchParams.mode === "practice"
        ? "practice"
        : "timed";
  const domainNumber = searchParams.domain ? parseInt(searchParams.domain, 10) : undefined;
  const count =
    mode === "timed"
      ? cert.questionCount
      : searchParams.count
        ? Math.min(100, Math.max(1, parseInt(searchParams.count, 10) || 20))
        : 20;

  const questions = await selectExamQuestions({
    certSlug: cert.slug,
    mode,
    count,
    domainNumber,
  });

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <p className="text-muted-foreground">No questions are available for this selection yet.</p>
        <Button asChild variant="outline">
          <Link href={`/certs/${cert.slug}`}>
            <ArrowLeft className="size-4" /> Back to {cert.name}
          </Link>
        </Button>
      </div>
    );
  }

  const qs = new URLSearchParams();
  qs.set("mode", mode);
  if (searchParams.count) qs.set("count", searchParams.count);
  if (domainNumber) qs.set("domain", String(domainNumber));
  const examHref = `/certs/${cert.slug}/exam?${qs.toString()}`;

  return (
    <ExamRunner
      certSlug={cert.slug}
      certName={cert.name}
      mode={mode}
      examMinutes={cert.examMinutes}
      questions={questions}
      backHref={`/certs/${cert.slug}`}
      examHref={examHref}
    />
  );
}
