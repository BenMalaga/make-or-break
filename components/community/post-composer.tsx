"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading,
  Quote,
  List,
  Link2,
  Code,
  FileCode,
  SquareTerminal,
  Eye,
  Pencil,
} from "lucide-react";
import { PostBody } from "./post-body";
import { cn } from "@/lib/utils";

/**
 * Reddit-style post composer: a textarea plus a formatting toolbar that inserts
 * markdown-lite, and a live preview rendered by the same PostBody used on the
 * feed. The textarea keeps its `name`, so it still posts through the server
 * action in the parent form.
 */
export function PostComposer({
  name = "body",
  defaultValue = "",
  placeholder = "Say what you want to ask or share. Use the buttons to add code, a terminal block, or formatting.",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  function apply(fn: (sel: string, before: string, after: string) => { text: string; s: number; e: number }) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.slice(0, start);
    const sel = value.slice(start, end);
    const after = value.slice(end);
    const r = fn(sel, before, after);
    setValue(r.text);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(r.s, r.e);
    });
  }

  function wrap(token: string, ph: string) {
    apply((sel, before, after) => {
      const inner = sel || ph;
      const s = before.length + token.length;
      return { text: before + token + inner + token + after, s, e: s + inner.length };
    });
  }

  function prefixLines(prefix: string, ph: string) {
    apply((sel, before, after) => {
      const block = sel || ph;
      const nl = before && !before.endsWith("\n") ? "\n" : "";
      const lines = block
        .split("\n")
        .map((l) => prefix + l)
        .join("\n");
      return {
        text: before + nl + lines + after,
        s: before.length + nl.length,
        e: before.length + nl.length + lines.length,
      };
    });
  }

  function fence(lang: string, ph: string) {
    apply((sel, before, after) => {
      const inner = sel || ph;
      const nl = before && !before.endsWith("\n") ? "\n" : "";
      const open = "```" + lang + "\n";
      const s = before.length + nl.length + open.length;
      return {
        text: before + nl + open + inner + "\n```\n" + after,
        s,
        e: s + inner.length,
      };
    });
  }

  function link() {
    apply((sel, before, after) => {
      const label = sel || "text";
      const snippet = "[" + label + "](url)";
      const urlStart = before.length + label.length + 3;
      return { text: before + snippet + after, s: urlStart, e: urlStart + 3 };
    });
  }

  const tools = [
    { icon: Bold, label: "Bold", run: () => wrap("**", "bold text") },
    { icon: Italic, label: "Italic", run: () => wrap("*", "italic text") },
    { icon: Heading, label: "Heading", run: () => prefixLines("## ", "Heading") },
    { icon: Quote, label: "Quote", run: () => prefixLines("> ", "quote") },
    { icon: List, label: "List", run: () => prefixLines("- ", "item") },
    { icon: Link2, label: "Link", run: link },
    { icon: Code, label: "Inline code", run: () => wrap("`", "code") },
    { icon: FileCode, label: "Code block", run: () => fence("", "your code here") },
    { icon: SquareTerminal, label: "Terminal block", run: () => fence("bash", "your command here") },
  ];

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            onClick={t.run}
            className="flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <t.icon className="size-4" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
            preview
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          )}
        >
          {preview ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
          {preview ? "Write" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="min-h-[12rem] p-3">
          {value.trim() ? (
            <PostBody body={value} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      ) : null}

      {/* Kept mounted (hidden in preview) so the value still submits with the form. */}
      <textarea
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={10}
        placeholder={placeholder}
        className={cn(
          "w-full resize-y rounded-md bg-transparent p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          preview && "hidden",
        )}
      />
    </div>
  );
}
