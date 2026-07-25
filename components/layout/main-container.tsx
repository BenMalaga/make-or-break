"use client";

import { usePathname } from "next/navigation";
import { GuestBanner } from "./guest-banner";

/**
 * Wraps page content. Most pages are centered at a readable max width and scroll
 * when long. The Build tab instead fills the entire available area and does not
 * scroll, so the IDE and terminal can take up all the room the shell has.
 */
export function MainContainer({
  isGuest,
  children,
}: {
  isGuest: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Build, and a single challenge (the LeetCode-style solver), fill the screen
  // and do not scroll. The challenges list (/challenges) scrolls like any page.
  const full =
    pathname.startsWith("/build") ||
    /^\/challenges\/(?!new)[^/]+/.test(pathname) ||
    /^\/messages\/[^/]+/.test(pathname);

  if (full) {
    return (
      <div className="flex h-full min-h-0 flex-col p-2 sm:p-3">
        {isGuest ? (
          <div className="mb-2 shrink-0">
            <GuestBanner />
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    // scrollbar-gutter:stable always reserves the scrollbar's width, so pages
    // with a scrollbar (long) and without one (short) keep the centered content
    // in the exact same place instead of jumping sideways between routes.
    <div className="h-full overflow-y-auto [scrollbar-gutter:stable]">
      {/* pb-24 on phones keeps page content clear of the fixed copilot button in
          the bottom-right; sm: restores even padding once it no longer overlaps. */}
      <div className="mx-auto w-full max-w-6xl p-4 pb-24 sm:p-6">
        {isGuest ? <GuestBanner /> : null}
        {children}
      </div>
    </div>
  );
}
