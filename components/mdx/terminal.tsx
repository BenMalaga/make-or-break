"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { runLine, prompt as promptOf, type ShellState } from "@/lib/terminal/shell";
import { TERMINAL_PRESETS, DEFAULT_PRESET } from "@/lib/terminal/presets";
import { cn } from "@/lib/utils";

interface Line {
  prompt?: string;
  text: string;
}

/** Imperative handle so an outside caller (the Build workbench) can print into it. */
export interface TerminalHandle {
  /** Print a command line (with the current prompt) followed by its output. */
  pushRun: (command: string, output: string) => void;
  focus: () => void;
}

/**
 * An embeddable, simulated Linux terminal. Runs entirely in the browser against
 * a fake filesystem, so a lesson can invite the reader to type commands for real
 * with nothing behind it.
 *
 *   <Terminal />                default boxed terminal for a lesson
 *   <Terminal bare fill />      no chrome, fills its container (the Build tab)
 */
export const Terminal = forwardRef<TerminalHandle, {
  preset?: string;
  user?: string;
  host?: string;
  /** No header bar. */
  bare?: boolean;
  /** Fill the parent's height instead of a fixed box. */
  fill?: boolean;
  title?: string;
}>(function Terminal(
  { preset = DEFAULT_PRESET, user = "hacker", host = "makeorbreak", bare = false, fill = false, title = "practice shell" },
  ref,
) {
  const root = TERMINAL_PRESETS[preset] ?? TERMINAL_PRESETS[DEFAULT_PRESET];
  const initial = useMemo<ShellState>(
    () => ({ root, cwd: ["home", user], user, host }),
    [root, user, host],
  );

  const [state, setState] = useState<ShellState>(initial);
  const [lines, setLines] = useState<Line[]>([
    { text: "Type a command, or `help`. This is a safe sandbox, not a real machine." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    pushRun: (command, output) => {
      setState((s) => {
        setLines((l) => [
          ...l,
          { prompt: promptOf(s), text: command },
          ...(output ? [{ text: output }] : []),
        ]);
        return s;
      });
    },
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  function submit() {
    const line = input;
    const p = promptOf(state);
    if (line.trim() === "history") {
      setLines((l) => [
        ...l,
        { prompt: p, text: line },
        { text: history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join("\n") },
      ]);
    } else {
      const res = runLine(state, line);
      if (res.clear) {
        setLines([]);
      } else {
        setLines((l) => [...l, { prompt: p, text: line }, ...(res.output ? [{ text: res.output }] : [])]);
      }
      setState(res.state);
    }
    if (line.trim()) setHistory((h) => [...h, line]);
    setInput("");
    setHistIdx(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === null) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(null);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx]);
      }
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-[#0b0e14] text-[#c9d1d9]",
        !bare && "my-4 rounded-lg border shadow-sm",
        fill ? "h-full" : "h-64",
      )}
    >
      {!bare ? (
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-[#8b949e]">{title}</span>
        </div>
      ) : null}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="scrollbar-thin flex-1 cursor-text overflow-y-auto p-3 font-mono text-[13px] leading-relaxed"
      >
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {l.prompt ? (
              <>
                <span className="text-[#7ee787]">{l.prompt}</span> {l.text}
              </>
            ) : (
              <span className="text-[#8b949e]">{l.text}</span>
            )}
          </div>
        ))}
        <div className="flex">
          <span className="shrink-0 text-[#7ee787]">{promptOf(state)}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="terminal input"
            className="ml-2 flex-1 border-0 bg-transparent p-0 font-mono text-[13px] text-[#c9d1d9] outline-none"
          />
        </div>
      </div>
    </div>
  );
});
