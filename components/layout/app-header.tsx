"use client";

import Link from "next/link";
import { Flame, Settings } from "lucide-react";
import { CommandMenu } from "./command-menu";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "@/components/brand/logo";
import { formatPoints } from "@/lib/utils";
import {
  currentStreakFrom,
  totalPoints,
  useProgress,
  useProgressHydrated,
} from "@/lib/progress/store";

// Header chips read the local progress store directly: no account, no server.
export function AppHeader() {
  const store = useProgress();
  const hydrated = useProgressHydrated();
  const points = hydrated ? totalPoints(store) : 0;
  const streak = hydrated ? currentStreakFrom(store.events) : 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <MobileNav />
      <div className="md:hidden">
        <Logo href="/dashboard" showText={false} />
      </div>
      <div className="flex-1">
        <CommandMenu />
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-sm sm:flex">
          {/* warning (amber) is the status family; hard is a difficulty token. */}
          <Flame className="size-4 text-warning" />
          {/* Both stats are mono + tabular so the digits match each other and do
              not jitter as the numbers change. */}
          <span className="font-mono font-semibold tabular-nums">{streak}</span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-sm">
          <span className="font-mono font-semibold tabular-nums text-primary">{formatPoints(points)}</span>
          {/* Label drops on phones so the points chip stays compact but visible. */}
          <span className="hidden text-xs text-muted-foreground sm:inline">pts</span>
        </div>
        <ThemeToggle />
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none ring-ring hover:bg-accent hover:text-foreground focus-visible:ring-2"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </header>
  );
}
