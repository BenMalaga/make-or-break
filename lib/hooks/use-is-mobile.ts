"use client";

import { useEffect, useState } from "react";

/**
 * True on narrow (phone) viewports. Starts false so server and first client
 * render agree (desktop-first, no hydration mismatch), then corrects on mount
 * and on viewport changes. Used to stack side-by-side panel layouts (the Build
 * IDE and the challenge solver) vertically on phones so nothing is clipped
 * off-screen.
 */
export function useIsMobile(query = "(max-width: 767px)"): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return isMobile;
}
