import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { GuestButton } from "@/components/auth/guest-button";
import { Logo } from "@/components/brand/logo";
import { LucideIcon } from "@/components/lucide-icon";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TRACKS } from "@/lib/tracks";

export default async function LandingPage() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {loggedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <GuestButton size="sm" label="Start free" showArrow={false} />
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" />
        <div className="container relative flex flex-col items-center py-20 text-center sm:py-28">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            Free and open source. No account needed to start.
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Do you want to <span className="text-make">make things</span> or{" "}
            <span className="text-primary">break things</span>?
          </h1>
          <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground">
            One platform to learn how technology actually works, by building it and by taking it
            apart. Start from zero, no experience assumed, and go as deep as you want.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {loggedIn ? (
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Continue <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <GuestButton size="lg" label="Start learning free" />
                <Button asChild size="lg" variant="outline">
                  <Link href="/register">Create an account</Link>
                </Button>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Your progress is saved from the first click. An account is optional.
          </p>

          {/* On-brand terminal motif: the make-vs-break duality as a shell session. */}
          <div className="mt-14 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-[#181818] text-left font-mono shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="ml-1 text-xs text-[#8b949e]">make-or-break</span>
            </div>
            <div className="space-y-2 p-4 text-sm leading-relaxed">
              <p className="text-[#8b949e]">
                <span className="text-make">$</span> makeorbreak --start
              </p>
              <p className="flex gap-3">
                <span className="w-32 shrink-0 text-make">&gt; make things</span>
                <span className="text-[#6b7280]">build: code, AI, hardware</span>
              </p>
              <p className="flex gap-3">
                <span className="w-32 shrink-0 text-primary">&gt; break things</span>
                <span className="text-[#6b7280]">security, networking</span>
              </p>
              <p className="text-[#c9d1d9]">
                choose one, or both
                <span className="ml-1 inline-block h-3.5 w-2 translate-y-px bg-[#c9d1d9] align-middle motion-safe:animate-[cursor-blink_1.1s_step-end_infinite]" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The two tracks */}
      <section className="container grid gap-4 py-16 md:grid-cols-2">
        {(["make", "break"] as const).map((id) => {
          const t = TRACKS[id];
          return (
            <Link
              key={id}
              href={loggedIn ? `/learn?track=${id}` : "/register"}
              className="hover-lift group flex flex-col rounded-xl border bg-card p-7"
            >
              <div
                className={`mb-4 flex size-11 items-center justify-center rounded-lg ${t.accentBg} ${t.accentText}`}
              >
                <LucideIcon name={t.icon} className="size-6" />
              </div>
              <h2 className="text-2xl font-bold">
                <span className={t.accentText}>{t.label}</span>
              </h2>
              <p className="mt-1 text-sm font-medium text-foreground/80">{t.tagline}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t.description}
              </p>
              <span
                className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${t.accentText}`}
              >
                Explore {t.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </section>

      {/* How it works */}
      <section className="border-t bg-card/30">
        <div className="container py-16">
          <h2 className="text-center text-2xl font-semibold">Built to make learning stick</h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-x-8 gap-y-10 sm:grid-cols-3">
            {[
              {
                icon: "GraduationCap",
                text: "text-make",
                bg: "bg-make/10",
                title: "Lessons that assume nothing",
                body: "Every term is defined the first time it appears, and each lesson builds on the last, so you are never lost. Hover any word you do not know.",
              },
              {
                icon: "Flag",
                text: "text-primary",
                bg: "bg-primary/10",
                title: "Practice, not just reading",
                body: "Interactive quizzes, hands-on machines and projects, and challenges you finish by doing, not by watching a video.",
              },
              {
                icon: "Trophy",
                text: "text-warning",
                bg: "bg-warning/10",
                title: "Progress you can feel",
                body: "Points, streaks, ranks, and paths that give a beginner a clear route from their first lesson to a real skill.",
              },
            ].map((p) => (
              <div key={p.title}>
                <div
                  className={`mb-4 flex size-11 items-center justify-center rounded-lg ${p.bg} ${p.text}`}
                >
                  <LucideIcon name={p.icon} className="size-6" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <Users className="size-4 text-make" />
            Capture the flag, community write-ups, and team challenges are on the way.
          </p>
        </div>
      </section>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">
            Practice security only on systems you own or are authorized to test.
          </p>
        </div>
      </footer>
    </div>
  );
}
