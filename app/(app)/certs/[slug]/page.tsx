import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, Play, Timer, Layers, Route, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LucideIcon } from "@/components/lucide-icon";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const c = await prisma.certification.findUnique({ where: { slug: params.slug } });
  return { title: c?.name ?? "Certification" };
}

export default async function CertDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const user = await requireUser();

  const cert = await prisma.certification.findUnique({
    where: { slug: params.slug },
    include: {
      domains: {
        orderBy: { number: "asc" },
        include: { _count: { select: { questions: true } } },
      },
      _count: { select: { questions: true } },
    },
  });
  if (!cert) notFound();

  const [attempts, path] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { userId: user.id, certificationId: cert.id },
      orderBy: { startedAt: "desc" },
      take: 6,
    }),
    prisma.path.findFirst({
      where: { certificationId: cert.id },
      include: { _count: { select: { items: true } } },
    }),
  ]);

  const hasQuestions = cert._count.questions > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/certs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Certifications
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LucideIcon name={cert.icon ?? "Award"} className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{cert.name}</h1>
            <p className="text-sm text-muted-foreground">
              {cert.vendor} - {cert.code}
            </p>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">{cert.description}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="size-3.5" /> {cert.examMinutes} min</span>
          <span>Pass mark {cert.passScore}%</span>
          <span>{cert._count.questions} questions in the bank</span>
        </div>
      </div>

      {path && path._count.items > 0 ? (
        <Link
          href={`/paths/${path.slug}`}
          className="flex items-center gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-primary/50"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Route className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">Follow the learning path</h3>
            <p className="text-sm text-muted-foreground">
              {path._count.items} lessons that cover this exam, in order. Learn it, do not just memorize it.
            </p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      ) : null}

      {!hasQuestions ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Practice questions for this exam are coming soon.
        </div>
      ) : (
        <>
          {/* Start options */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col justify-between rounded-lg border bg-card p-5">
              <div>
                <Timer className="mb-2 size-5 text-primary" />
                <h3 className="font-semibold">Full mock exam</h3>
                <p className="text-sm text-muted-foreground">
                  {cert.questionCount} questions, {cert.examMinutes} minutes, timed and weighted like the real thing.
                </p>
              </div>
              <Button asChild className="mt-4 w-fit">
                <Link href={`/certs/${cert.slug}/exam?mode=timed`}>
                  <Play className="size-4" /> Start timed exam
                </Link>
              </Button>
            </div>
            <div className="flex flex-col justify-between rounded-lg border bg-card p-5">
              <div>
                <Layers className="mb-2 size-5 text-primary" />
                <h3 className="font-semibold">Quick practice</h3>
                <p className="text-sm text-muted-foreground">
                  20 random questions, untimed, with instant explanations. Warm up fast.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-4 w-fit">
                <Link href={`/certs/${cert.slug}/exam?mode=practice&count=20`}>
                  <Play className="size-4" /> Quick 20
                </Link>
              </Button>
            </div>
          </div>

          {/* Domains */}
          <div className="rounded-lg border bg-card">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Domains - drill one at a time</h2>
            </div>
            <ul className="divide-y divide-border/60">
              {cert.domains.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    {d.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.weight}% of exam - {d._count.questions} questions
                    </p>
                  </div>
                  {d._count.questions > 0 ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/certs/${cert.slug}/exam?mode=domain&domain=${d.number}&count=20`}>
                        Practice
                      </Link>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {/* History */}
          {attempts.length > 0 ? (
            <div className="rounded-lg border bg-card">
              <div className="border-b px-5 py-3">
                <h2 className="text-sm font-semibold">Your attempts</h2>
              </div>
              <ul className="divide-y divide-border/60">
                {attempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-muted-foreground">
                      {a.mode} - {a.correctCount}/{a.totalCount} - {timeAgo(a.startedAt)}
                    </span>
                    <span className={a.passed ? "font-medium text-success" : "font-medium text-muted-foreground"}>
                      {a.score}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
