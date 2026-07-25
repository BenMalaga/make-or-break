import { Flame } from "lucide-react";
import { CommandMenu } from "./command-menu";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu, type UserMenuData } from "./user-menu";
import { Logo } from "@/components/brand/logo";
import { formatPoints } from "@/lib/utils";

export interface HeaderData extends UserMenuData {
  streakCount: number;
}

export function AppHeader({ user }: { user: HeaderData }) {
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
          <span className="font-mono font-semibold tabular-nums">{user.streakCount}</span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-sm">
          <span className="font-mono font-semibold tabular-nums text-primary">{formatPoints(user.points)}</span>
          {/* Label drops on phones so the points chip stays compact but visible. */}
          <span className="hidden text-xs text-muted-foreground sm:inline">pts</span>
        </div>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
