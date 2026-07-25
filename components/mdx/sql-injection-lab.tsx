"use client";

import { useState } from "react";
import { Lock, Maximize2, Minimize2, RotateCcw, ShieldAlert, Flag, Lightbulb } from "lucide-react";
import { runLogin, type Row, type QueryResult } from "@/lib/labs/sql";
import { cn } from "@/lib/utils";

const USERS: Row[] = [
  { username: "admin", password: "S3cr3t_P@ss!", role: "admin" },
  { username: "editor", password: "letmein2024", role: "editor" },
  { username: "guest", password: "guest", role: "user" },
];

/**
 * A hands-on SQL injection lab. The login form is backed by a real (in-browser,
 * fake) vulnerable query, so the classic payloads actually get the learner in.
 * Embeddable in a lesson via <SqlInjectionLab />, and it can go full screen.
 */
export function SqlInjectionLab({
  appName = "Acme Admin Portal",
  flag = "MOB{sql_1nj3ct10n_auth_bypass}",
}: {
  appName?: string;
  flag?: string;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [solved, setSolved] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  function attempt(e: React.FormEvent) {
    e.preventDefault();
    const res = runLogin(USERS, username, password);
    setResult(res);
    // Solved = logged in as admin without supplying the real admin password.
    if (res.matched && res.matched.username === "admin" && res.matched.password !== password) {
      setSolved(true);
    }
  }

  function reset() {
    setUsername("");
    setPassword("");
    setResult(null);
    setSolved(false);
  }

  const loggedIn = result?.matched ?? null;

  return (
    <div
      className={cn(
        "my-4",
        fullscreen && "fixed inset-0 z-50 overflow-auto bg-background/95 p-4 backdrop-blur sm:p-8",
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card",
          fullscreen && "mx-auto max-w-3xl",
        )}
      >
        {/* Lab chrome */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <ShieldAlert className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lab: SQL injection
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
          <span className="font-semibold text-primary">Goal:</span> log in as{" "}
          <span className="font-mono">admin</span> without knowing the password.
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {/* The fake app */}
          <div className="rounded-lg border bg-background p-5">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              <span className="font-semibold">{appName}</span>
            </div>
            {solved ? (
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-success">
                  Signed in as {loggedIn?.username} ({String(loggedIn?.role)}).
                </p>
                <p className="text-muted-foreground">
                  No valid password required. That is a SQL injection auth bypass.
                </p>
                <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 p-2 font-mono text-xs text-success">
                  <Flag className="size-3.5 shrink-0" /> {flag}
                </div>
              </div>
            ) : loggedIn ? (
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-success">Signed in as {loggedIn.username}.</p>
                <p className="text-muted-foreground">
                  That used a real password. Now do it as admin, without one.
                </p>
              </div>
            ) : (
              <form onSubmit={attempt} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {result && !result.matched ? (
                  <p className="text-xs text-destructive">
                    {result.error ? result.error : "Access denied. Wrong username or password."}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Log in
                </button>
              </form>
            )}
          </div>

          {/* Behind the scenes */}
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                The query it runs
              </p>
              <pre className="scrollbar-thin overflow-x-auto rounded-md border bg-[#0b0e14] p-3 font-mono text-[11px] leading-relaxed text-[#c9d1d9]">
                <code>
                  <span className="text-[#8b949e]">SELECT * FROM users WHERE</span> username ={" "}
                  <span className="text-[#7ee787]">
                    &apos;{result ? highlight(username) : "..."}&apos;
                  </span>{" "}
                  <span className="text-[#8b949e]">AND</span> password ={" "}
                  <span className="text-[#7ee787]">
                    &apos;{result ? highlight(password) : "..."}&apos;
                  </span>
                </code>
              </pre>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Your input is dropped straight into the query. Whatever you type becomes part of the
                logic.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Lightbulb className="size-3.5" /> {showHint ? "Hide hint" : "Show a hint"}
            </button>
            {showHint ? (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                <p>
                  Try putting <code className="rounded bg-muted px-1 font-mono">admin&apos; --</code>{" "}
                  in the username. The <code className="rounded bg-muted px-1 font-mono">--</code>{" "}
                  starts a comment, so the password check after it is ignored. Or put{" "}
                  <code className="rounded bg-muted px-1 font-mono">&apos; OR 1=1 --</code> to match
                  the first user in the table.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Show the raw input, making an empty field visible as a placeholder. */
function highlight(value: string): string {
  return value.length ? value : "";
}
