"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { ResolvedEntry } from "@/lib/glossary";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BrowserEntry = ResolvedEntry & { usageCount?: number };

type SortKey = "az" | "za" | "category";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "az", label: "A to Z" },
  { key: "za", label: "Z to A" },
  { key: "category", label: "Category" },
];

export function GlossaryBrowser({
  entries,
  categories,
}: {
  entries: BrowserEntry[];
  categories: { slug: string; label: string; count: number }[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("az");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Search the definition too, so "the thing that turns names into addresses"
    // finds DNS even when the reader does not know the word yet.
    let out = entries.filter((e) => {
      if (category && e.category !== category) return false;
      if (!q) return true;
      return (
        e.term.toLowerCase().includes(q) ||
        e.id.includes(q) ||
        e.definition.toLowerCase().includes(q)
      );
    });

    out = [...out].sort((a, b) => {
      if (sort === "za") return b.term.localeCompare(a.term, "en", { sensitivity: "base" });
      if (sort === "category") {
        const c = a.categoryLabel.localeCompare(b.categoryLabel);
        if (c !== 0) return c;
      }
      return a.term.localeCompare(b.term, "en", { sensitivity: "base" });
    });
    return out;
  }, [entries, query, category, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms and definitions"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-md border p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                sort === s.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setCategory(null)}>
          <Badge variant={category === null ? "default" : "outline"} className="cursor-pointer">
            All {entries.length}
          </Badge>
        </button>
        {categories.map((c) => (
          <button key={c.slug} type="button" onClick={() => setCategory(c.slug)}>
            <Badge
              variant={category === c.slug ? "default" : "outline"}
              className="cursor-pointer"
            >
              {c.label} {c.count}
            </Badge>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {visible.length} {visible.length === 1 ? "term" : "terms"}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing matches that. Try a different word.
        </p>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          {visible.map((e) => (
            <Link
              key={e.id}
              id={e.id}
              href={`/glossary/${e.id}`}
              className="hover-lift group block rounded-lg border bg-card p-4 scroll-mt-24"
            >
              <div className="flex items-start justify-between gap-3">
                <dt className="font-semibold group-hover:text-primary">{e.term}</dt>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
              </div>
              <dd className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {e.definition}
              </dd>
              <dd className="mt-2 flex items-center gap-2 border-t pt-2 text-[10px] text-muted-foreground/70">
                <Badge variant="outline" className="text-[10px]">
                  {e.categoryLabel}
                </Badge>
                {e.usageCount ? (
                  <span>
                    {e.usageCount} {e.usageCount === 1 ? "lesson" : "lessons"}
                  </span>
                ) : null}
              </dd>
            </Link>
          ))}
        </dl>
      )}
    </div>
  );
}
