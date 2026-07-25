"use client";

import { useState } from "react";
import { Maximize2, Minimize2, RotateCcw, ShieldAlert, Flag, Lightbulb, Terminal as TerminalIcon } from "lucide-react";
import { runNetTool, type ShellRunResult, COMMAND_INJECTION_FLAG } from "@/lib/labs/shell";
import { cn } from "@/lib/utils";

/**
 * A hands-on command injection lab. A fake "network tools" page runs
 * `ping -c 1 <input>` by pasting the input straight into a shell command, so a
 * separator or a `$(...)` substitution in the input runs a second command for
 * real (against a small in-browser virtual filesystem). Embed via
 * <CommandInjectionLab />; it can also go full screen.
 */
export function CommandInjectionLab({
  appName = "NetTools :: Ping",
  flag = COMMAND_INJECTION_FLAG,
}: {
  appName?: string;
  flag?: string;
}) {
  const [host, setHost] = useState("");
  const [result, setResult] = useState<ShellRunResult | null>(null);
  const [solved, setSolved] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  function run(e: React.FormEvent) {
    e.preventDefault();
    const res = runNetTool(host);
    setResult(res);
    if (res.solved) setSolved(true);
  }

  function reset() {
    setHost("");
    setResult(null);
    setSolved(false);
  }

  return (
    <div
      className={cn(
        "my-4",
        fullscreen && "fixed inset-0 z-50 overflow-auto bg-background/95 p-4 backdrop-blur sm:p-8",
      )}
    >
      <div className={cn("overflow-hidden rounded-lg border bg-card", fullscreen && "mx-auto max-w-3xl")}>
        {/* Lab chrome */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <ShieldAlert className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lab: command injection
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              {fullscreen ? "Exit" : "Full screen"}
            </button>
          </div>
        </div>

        {/* Goal */}
        <div className="border-b bg-primary/5 px-4 py-2 text-sm">
          <span className="font-semibold text-primary">Goal:</span> the box only means to ping a
          host. Make it run a command of your own and read{" "}
          <span className="font-mono">/flag.txt</span>.
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {/* The fake app */}
          <div className="rounded-lg border bg-background p-5">
            <div className="mb-3 flex items-center gap-2">
              <TerminalIcon className="size-4 text-primary" />
              <span className="font-semibold">{appName}</span>
            </div>
            <form onSubmit={run} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Host to ping</label>
                <input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="8.8.8.8"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ping
              </button>
            </form>

            {result ? (
              <pre className="scrollbar-thin mt-3 max-h-52 overflow-auto rounded-md border bg-[#0b0e14] p-3 font-mono text-[11px] leading-relaxed text-[#c9d1d9]">
                <code>
                  {result.pingOutput}
                  {result.injected.length
                    ? "\n" + result.injected.map((i) => i.output).filter(Boolean).join("\n")
                    : ""}
                </code>
              </pre>
            ) : null}
          </div>

          {/* Behind the scenes */}
          <div className="space-y-3">
            {solved ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-success">Your command ran on the server.</p>
                <p className="text-muted-foreground">
                  The app pasted the input into a shell command, so the shell read your separator
                  and ran a second command. That is command injection, and it runs as the web
                  server user.
                </p>
                <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 p-2 font-mono text-xs text-success">
                  <Flag className="size-3.5 shrink-0" /> {flag}
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  The command it builds
                </p>
                <pre className="scrollbar-thin overflow-x-auto rounded-md border bg-[#0b0e14] p-3 font-mono text-[11px] leading-relaxed text-[#c9d1d9]">
                  <code>
                    <span className="text-[#8b949e]">ping -c 1 </span>
                    <span className="text-[#7ee787]">{host || "..."}</span>
                  </code>
                </pre>
                <p className="text-xs text-muted-foreground">
                  The whole line is handed to a shell. The shell does not know which part was meant
                  to be a hostname, so any shell syntax in the input is syntax it obeys.
                </p>
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Lightbulb className="size-3.5" /> {showHint ? "Hide hint" : "Show a hint"}
                </button>
                {showHint ? (
                  <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    A semicolon ends one command and starts another. Try{" "}
                    <code className="rounded bg-muted px-1 font-mono">8.8.8.8; cat /flag.txt</code>.
                    A pipe or <code className="rounded bg-muted px-1 font-mono">$(...)</code> works
                    too, for example <code className="rounded bg-muted px-1 font-mono">$(whoami)</code>.
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
