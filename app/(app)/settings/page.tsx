import Link from "next/link";
import type { Metadata } from "next";
import { Download, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
  const roleLabel = user.role === "USER" ? "Member" : titleCase(user.role);

  const rows: [string, string][] = [
    ["Username", user.username],
    // Guests have a synthetic guest-<uuid>@guest.local address that should never
    // be shown as if it were a real email.
    ["Email", user.isGuest ? "Guest session (no email)" : user.email],
    ["Role", roleLabel],
    ["Plan", titleCase(user.subscriptionTier)],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Account</h2>
        </div>
        <dl className="divide-y divide-border/60">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex items-center justify-between rounded-lg border bg-card px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="text-xs text-muted-foreground">Catppuccin Mocha (dark) or Latte (light).</p>
        </div>
        <ThemeToggle />
      </section>

      <section className="flex items-center justify-between rounded-lg border bg-card px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Your data</h2>
          <p className="text-xs text-muted-foreground">Export all your progress and writeups as JSON.</p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/me/export" download>
            <Download className="size-4" /> Export
          </a>
        </Button>
      </section>

      <section className="flex items-center justify-between rounded-lg border bg-card px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-success" /> Rules of engagement
          </h2>
          <p className="text-xs text-muted-foreground">The ethics agreement you accepted.</p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/rules">View</Link>
        </Button>
      </section>
    </div>
  );
}
