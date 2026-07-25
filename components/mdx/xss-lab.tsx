"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, RotateCcw, ShieldAlert, Flag, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

// The vulnerable app runs inside a sandboxed iframe: scripts execute (so the
// XSS is real) but the iframe is a unique origin with no access to the parent,
// so nothing can touch the real page. It inserts the comment with innerHTML,
// which is the actual bug. Note: a raw <script> tag inserted via innerHTML does
// NOT run, but an event handler like <img onerror> does, which the lab teaches.
const APP_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#fff;color:#111}
  h3{margin:0 0 12px}
  .c{border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:14px}
  form{display:flex;gap:8px;margin-top:8px}
  input{flex:1;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px}
  button{padding:8px 14px;border:0;border-radius:6px;background:#4f46e5;color:#fff;font-size:14px;cursor:pointer}
</style></head><body>
  <h3>Guestbook</h3>
  <div id="comments"><div class="c">Nice site, thanks for sharing!</div></div>
  <form id="f"><input id="i" placeholder="Leave a comment" autocomplete="off"><button>Post</button></form>
  <script>
    window.alert = function(m){ parent.postMessage({t:"xss", msg:String(m)}, "*"); };
    var f=document.getElementById("f"), i=document.getElementById("i"), c=document.getElementById("comments");
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var html = '<div class="c">' + i.value + '</div>';
      parent.postMessage({t:"posted", html: html}, "*");
      c.innerHTML += html; // vulnerable: raw user input inserted as HTML
      i.value="";
    });
  <\/script>
</body></html>`;

export function XssLab({ flag = "MOB{xss_stored_html_injection}" }: { flag?: string }) {
  const [solved, setSolved] = useState(false);
  const [lastHtml, setLastHtml] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // Only trust messages from our own sandboxed frame.
      if (frame.current && e.source !== frame.current.contentWindow) return;
      const d = e.data;
      if (d?.t === "xss") setSolved(true);
      else if (d?.t === "posted") setLastHtml(String(d.html));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function reset() {
    setSolved(false);
    setLastHtml(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <div
      className={cn(
        "my-4",
        fullscreen && "fixed inset-0 z-50 overflow-auto bg-background/95 p-4 backdrop-blur sm:p-8",
      )}
    >
      <div className={cn("overflow-hidden rounded-lg border bg-card", fullscreen && "mx-auto max-w-3xl")}>
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <ShieldAlert className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lab: cross-site scripting
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

        <div className="border-b bg-primary/5 px-4 py-2 text-sm">
          <span className="font-semibold text-primary">Goal:</span> post a comment that makes the
          page run JavaScript (pop an alert).
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-lg border">
            <iframe
              key={reloadKey}
              ref={frame}
              title="Vulnerable guestbook"
              sandbox="allow-scripts"
              srcDoc={APP_HTML}
              className="h-64 w-full bg-white"
            />
          </div>

          <div className="space-y-3">
            {solved ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-success">Your script ran on the page.</p>
                <p className="text-muted-foreground">
                  The comment was inserted as HTML without escaping, so your payload became part of
                  the page. That is cross-site scripting.
                </p>
                <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 p-2 font-mono text-xs text-success">
                  <Flag className="size-3.5 shrink-0" /> {flag}
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What the app inserts
                </p>
                <pre className="scrollbar-thin overflow-x-auto rounded-md border bg-[#0b0e14] p-3 font-mono text-[11px] leading-relaxed text-[#c9d1d9]">
                  <code>
                    comments.innerHTML += {"'<div class=\"c\">'"} +{" "}
                    <span className="text-[#7ee787]">{lastHtml ? "your input" : "..."}</span> +{" "}
                    {"'</div>'"}
                  </code>
                </pre>
                <p className="text-xs text-muted-foreground">
                  Your comment is dropped straight into the page as HTML. Plain text shows as text,
                  but HTML tags become real elements.
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
                    A raw{" "}
                    <code className="rounded bg-muted px-1 font-mono">{"<script>"}</code> tag added
                    this way will not run. Use an element with an event handler instead, like{" "}
                    <code className="rounded bg-muted px-1 font-mono">
                      {"<img src=x onerror=alert(1)>"}
                    </code>
                    . The broken image fires its error handler, which runs your code.
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
