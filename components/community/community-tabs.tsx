import Link from "next/link";
import { MessagesSquare, Trophy, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sub-navigation for the Community section: the ranked feed, the global
 * leaderboard, and community write-ups all live under one tab.
 */
export function CommunityTabs({
  active,
}: {
  active: "feed" | "leaderboard" | "writeups";
}) {
  const tabs = [
    { id: "feed", label: "Feed", href: "/community", icon: MessagesSquare },
    { id: "leaderboard", label: "Leaderboard", href: "/community/leaderboard", icon: Trophy },
    { id: "writeups", label: "Write-ups", href: "/community/writeups", icon: FileText },
  ] as const;

  return (
    <div className="inline-flex flex-wrap rounded-lg border bg-card p-1">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}
