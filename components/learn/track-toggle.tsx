"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TRACKS, TRACK_IDS, type TrackId } from "@/lib/tracks";
import { LucideIcon } from "@/components/lucide-icon";
import { cn } from "@/lib/utils";

/**
 * The Make / Break switch. Drives the `?track=` param, so the choice is in the
 * URL (shareable, back-button friendly) and the server renders the right catalog.
 */
export function TrackToggle({ active }: { active: TrackId }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(track: TrackId) {
    if (track === active) return;
    const next = new URLSearchParams(params);
    next.set("track", track);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="inline-flex rounded-lg border bg-card p-1">
      {TRACK_IDS.map((id) => {
        const track = TRACKS[id];
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => select(id)}
            aria-pressed={on}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              on
                ? id === "break"
                  ? "bg-primary/10 text-primary"
                  : "bg-make/10 text-make"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LucideIcon name={track.icon} className="size-4" />
            {track.label}
          </button>
        );
      })}
    </div>
  );
}
