"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Search, Sun, BookOpen, Server, Award } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { LucideIcon } from "@/components/lucide-icon";
import { APP_NAV } from "@/lib/constants";

interface SearchResults {
  lessons: { title: string; slug: string; moduleSlug: string; moduleTitle: string }[];
  machines: { name: string; slug: string }[];
  certs: { name: string; slug: string }[];
}

const EMPTY: SearchResults = { lessons: [], machines: [], certs: [] };

/** Cmd/Ctrl+K palette: global search over lessons, machines, and certs, plus nav + theme. */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  // Defaults to the Mac glyph (server + first client render agree), then
  // corrects to "Ctrl K" on non-Mac platforms after mount.
  const [modKey, setModKey] = useState("⌘K");
  const router = useRouter();
  const { setTheme } = useTheme();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
    if (!isMac) setModKey("Ctrl K");
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    const ac = new AbortController();
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ac.signal });
        if (r.ok) setResults(await r.json());
      } catch {
        /* aborted or offline */
      }
    }, 200);
    return () => {
      ac.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function run(fn: () => void) {
    setOpen(false);
    setQuery("");
    fn();
  }

  const hasQuery = query.trim().length >= 2;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-full max-w-64 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/40"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none hidden select-none rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">
          {modKey}
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQuery("");
        }}
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Search lessons, machines, certifications..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {hasQuery ? <CommandEmpty>No results for {`"${query}"`}.</CommandEmpty> : null}

          {!hasQuery ? (
            <>
              <CommandGroup heading="Navigation">
                {APP_NAV.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`nav-${item.label}`}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <LucideIcon name={item.icon} className="size-4" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Theme">
                <CommandItem value="theme-dark" onSelect={() => run(() => setTheme("dark"))}>
                  <Moon className="size-4" /> Dark
                </CommandItem>
                <CommandItem value="theme-light" onSelect={() => run(() => setTheme("light"))}>
                  <Sun className="size-4" /> Light
                </CommandItem>
              </CommandGroup>
            </>
          ) : null}

          {hasQuery && results.lessons.length > 0 ? (
            <CommandGroup heading="Lessons">
              {results.lessons.map((l) => (
                <CommandItem
                  key={`l-${l.slug}`}
                  value={`lesson-${l.slug}`}
                  onSelect={() => run(() => router.push(`/learn/${l.moduleSlug}/${l.slug}`))}
                >
                  <BookOpen className="size-4" />
                  <span className="flex-1 truncate">{l.title}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">{l.moduleTitle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {hasQuery && results.machines.length > 0 ? (
            <CommandGroup heading="Machines">
              {results.machines.map((m) => (
                <CommandItem
                  key={`m-${m.slug}`}
                  value={`machine-${m.slug}`}
                  onSelect={() => run(() => router.push(`/machines/${m.slug}`))}
                >
                  <Server className="size-4" /> {m.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {hasQuery && results.certs.length > 0 ? (
            <CommandGroup heading="Certifications">
              {results.certs.map((c) => (
                <CommandItem
                  key={`c-${c.slug}`}
                  value={`cert-${c.slug}`}
                  onSelect={() => run(() => router.push(`/certs/${c.slug}`))}
                >
                  <Award className="size-4" /> {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
