import type { Metadata } from "next";
import { Check, Coffee, Gift, Sparkles, Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Support",
  description: "Make or Break is free and open source. Support it to keep it that way.",
};

const PRO_PERKS = [
  "Everything in the free version (which is everything you learn on)",
  "A Supporter badge on your profile and posts",
  "Custom editor and terminal themes",
  "A larger in-browser AI model for the copilot",
  "Early access to new modules and challenges",
  "Your name in the supporters credits",
  "The good feeling of keeping this free and open for everyone",
];

const DONATIONS = [
  { icon: Coffee, amount: "$5", label: "Buy a coffee", perk: "A one-time thanks and a supporter badge." },
  { icon: Gift, amount: "$15", label: "Supporter", perk: "Supporter badge plus your name in the credits." },
  { icon: Sparkles, amount: "$50", label: "Patron", perk: "All of the above plus early access to new content." },
];

export default function SupportPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="Support us"
        subtitle="Make or Break is free and open source, and it always will be. Every lesson, challenge, and the whole in-browser IDE cost nothing to use. If it is helping you and you want to keep it going, you can chip in. That is the only reason to."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Pro subscription */}
        <div className="flex flex-col rounded-xl border bg-card p-6">
          <div className="mb-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold">$5</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
          <p className="mb-4 text-sm font-medium text-primary">Pro. Support the project.</p>
          <ul className="mb-6 flex-1 space-y-2 text-sm">
            {PRO_PERKS.map((p) => (
              <li key={p} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground opacity-70"
          >
            Go Pro (coming soon)
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Cancel any time. Nothing you learn on is ever locked behind it.
          </p>
        </div>

        {/* One-time donation */}
        <div className="flex flex-col rounded-xl border bg-card p-6">
          <div className="mb-1 text-3xl font-bold">One time</div>
          <p className="mb-4 text-sm font-medium text-primary">Not a fan of subscriptions? Give once.</p>
          <ul className="mb-6 flex-1 space-y-3 text-sm">
            {DONATIONS.map((d) => (
              <li key={d.amount} className="flex items-start gap-3 rounded-lg border p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <d.icon className="size-4" />
                </span>
                <div>
                  <p className="font-medium">
                    {d.amount} <span className="text-muted-foreground">- {d.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{d.perk}</p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-md border py-2.5 text-sm font-semibold opacity-70"
          >
            Donate (coming soon)
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold">
          <Lock className="size-4 text-primary" /> What stays free, always
        </h2>
        <p className="text-sm text-muted-foreground">
          All of the learning. Every lesson, path, and certification track. Every challenge and the
          built-in IDE. The community. Guest accounts with saved progress. Supporting the project
          only ever adds cosmetic and convenience perks on top. It never takes anything away from
          the people who cannot pay, because that would defeat the whole point.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Common questions</h2>
        {[
          {
            q: "Is the free version limited?",
            a: "No. Free is the whole product for learning. Pro adds cosmetics, a bigger AI model, and early access, and it says thank you.",
          },
          {
            q: "Why ask for money if it is open source?",
            a: "Open source and paying the bills are not in conflict. Hosting, a domain, and the time to keep building all cost something. Support is how a free, open project keeps going without ads or selling your data.",
          },
          {
            q: "When can I actually pay?",
            a: "Soon. The checkout is not wired up yet on purpose. Building payment flows before there is a real audience is a distraction. This page is here so the plan is honest and in the open.",
          },
        ].map((f) => (
          <div key={f.q} className="rounded-lg border bg-card p-4">
            <p className="font-medium">{f.q}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
