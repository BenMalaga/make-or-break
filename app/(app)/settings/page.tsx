"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useProgress } from "@/lib/progress/store";

// Settings without accounts: appearance, a local data export, and the rules.
// Everything the learner does lives in their browser; export is the backup path.
export default function SettingsPage() {
  const exportJSON = useProgress((s) => s.exportJSON);

  function download() {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "make-or-break-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          There are no accounts on this platform. Your progress saves itself in
          this browser.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <ThemeToggle />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your data
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Download everything this browser holds: completed lessons, notes,
          solves, points, and badges, as one JSON file.
        </p>
        <Button variant="outline" onClick={download}>
          <Download className="size-4" /> Export progress
        </Button>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Rules
        </h2>
        <p className="text-sm text-muted-foreground">
          Practice security only on systems you own or are authorized to test.
          Read the{" "}
          <a href="/rules" className="text-primary underline-offset-4 hover:underline">
            rules of engagement
          </a>
          .
        </p>
      </section>
    </div>
  );
}
