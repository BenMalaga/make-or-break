import Link from "next/link";
import { Info } from "lucide-react";

/** Shown to guest accounts, nudging them to claim their progress. */
export function GuestBanner() {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary" />
        You are learning as a guest. Your progress is saved here already.
      </span>
      <Link href="/register" className="font-medium text-primary hover:underline">
        Create a free account so you never lose it
      </Link>
    </div>
  );
}
