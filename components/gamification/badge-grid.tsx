import { LucideIcon } from "@/components/lucide-icon";
import { cn } from "@/lib/utils";

export interface BadgeItem {
  code: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

/** All achievements, earned ones lit, the rest shown locked as goals. */
export function BadgeGrid({ badges }: { badges: BadgeItem[] }) {
  const earnedCount = badges.filter((b) => b.earned).length;
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-semibold">Badges</h2>
        <span className="text-xs text-muted-foreground">
          {earnedCount}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {badges.map((b) => (
          <div
            key={b.code}
            className={cn(
              "flex flex-col items-center rounded-lg border p-3 text-center",
              b.earned ? "border-primary/40 bg-primary/5" : "opacity-50",
            )}
            title={b.description}
          >
            <div
              className={cn(
                "mb-2 flex size-9 items-center justify-center rounded-full",
                b.earned ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              <LucideIcon name={b.earned ? b.icon : "Lock"} className="size-4" />
            </div>
            <p className="text-xs font-medium leading-tight">{b.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
