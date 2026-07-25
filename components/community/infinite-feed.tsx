"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeedPage } from "@/lib/actions/community";
import type { FeedSort } from "@/lib/community";
import { PostCard, type FeedItem } from "./post-card";

const PAGE = 10;

/**
 * The dashboard's community feed. Renders an initial page from the server, then
 * loads more as the sentinel scrolls into view, so scrolling the dashboard
 * flows straight into the community.
 */
export function InfiniteFeed({
  initial,
  sort = "hot",
}: {
  initial: FeedItem[];
  sort?: FeedSort;
}) {
  const [items, setItems] = useState<FeedItem[]>(initial);
  const [done, setDone] = useState(initial.length < PAGE);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const more = await fetchFeedPage(sort, items.length);
      setItems((prev) => {
        // De-dupe defensively in case a new post shifted the window.
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...more.filter((m) => !seen.has(m.id))];
      });
      if (more.length < PAGE) setDone(true);
    } finally {
      setLoading(false);
    }
  }, [loading, done, sort, items.length]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, done]);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No community posts yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <PostCard key={item.id} item={item} />
      ))}
      {!done ? (
        <div ref={sentinel} className="py-4 text-center text-xs text-muted-foreground">
          {loading ? "Loading more..." : ""}
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-muted-foreground">You are all caught up.</p>
      )}
    </div>
  );
}
