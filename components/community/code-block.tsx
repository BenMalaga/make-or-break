"use client";

import { useState } from "react";
import { Check, Copy, TerminalSquare } from "lucide-react";

const TERMINAL_LANGS = new Set(["bash", "sh", "shell", "terminal", "console", "zsh", "cmd", "powershell", "ps1"]);

/**
 * A code or terminal block inside a post, with a copy button. Language comes
 * from the fence info string (```bash). Terminal-ish languages get a prompt
 * label so a command reads as a command.
 */
export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const isTerminal = lang ? TERMINAL_LANGS.has(lang.toLowerCase()) : false;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the code is still selectable.
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {isTerminal ? <TerminalSquare className="size-3.5" /> : null}
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-success" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-3 font-mono text-[0.8rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
