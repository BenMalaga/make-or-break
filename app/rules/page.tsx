import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Rules of engagement" };

const RULES = [
  {
    title: "Authorized targets only",
    body: "Only attack machines you own, machines this platform explicitly provides for you, or systems you have written permission to test. Everything on Make or Break is designed around targets you run yourself or that are provisioned for you.",
  },
  {
    title: "Never touch third parties",
    body: "Do not point tools, scans, or exploits at any system that is not an authorized target. Scanning or attacking systems without permission is illegal in most jurisdictions and will get you banned here.",
  },
  {
    title: "Keep techniques in the lab",
    body: "The skills you learn are powerful. Use them to defend, to test with permission, and to build. Do not use them to cause harm, steal, or disrupt.",
  },
  {
    title: "Responsible disclosure",
    body: "If you find a real vulnerability in a real system in the course of your own authorized work, report it responsibly to the owner and give them time to fix it before any disclosure.",
  },
  {
    title: "No flag sharing",
    body: "Submit flags you captured yourself. Sharing flags or writeups for un-retired machines undermines everyone's learning and is treated as cheating.",
  },
];

export default function RulesPage() {
  return (
    <div className="min-h-svh bg-grid">
      <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
        <Logo href="/" />
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
      </header>
      <main className="container max-w-2xl py-12">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="size-7 text-primary" />
          <h1 className="text-2xl font-bold">Rules of engagement</h1>
        </div>
        <p className="mb-8 text-muted-foreground">
          Make or Break exists to teach offensive security ethically. Membership
          is contingent on following these rules. They are not fine print.
        </p>
        <ol className="space-y-5">
          {RULES.map((r, i) => (
            <li key={r.title} className="rounded-lg border bg-card p-5">
              <h2 className="mb-1 flex items-center gap-2 font-semibold">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {r.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
