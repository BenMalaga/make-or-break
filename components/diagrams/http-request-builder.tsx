"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Build a raw HTTP/1.1 request from a method, path, and one optional header,
 * then read exactly what would travel on the wire plus a plausible response
 * line. Used via <Diagram type="http-request" />.
 *
 * Attacker's eye: HTTP is plain text. Whoever sits on the path reads the method,
 * the path, the Host, and any header you send. Nothing here is a secret.
 */

const METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"] as const;
type Method = (typeof METHODS)[number];

const HEADERS: { key: string; value: string; label: string }[] = [
  { key: "", value: "", label: "None" },
  { key: "Authorization", value: "Bearer eyJhbGciOi...", label: "Authorization" },
  { key: "Cookie", value: "session=3f9a...c21", label: "Cookie" },
  { key: "User-Agent", value: "curl/8.4.0", label: "User-Agent" },
  { key: "Content-Type", value: "application/json", label: "Content-Type" },
];

const HOST = "target.example.com";

function responseLine(method: Method): string {
  if (method === "DELETE") return "HTTP/1.1 204 No Content";
  if (method === "POST" || method === "PUT") return "HTTP/1.1 201 Created";
  if (method === "OPTIONS") return "HTTP/1.1 200 OK";
  return "HTTP/1.1 200 OK";
}

export function HttpRequestBuilder() {
  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("/api/users/1");
  const [headerIdx, setHeaderIdx] = useState(0);

  const header = HEADERS[headerIdx];
  const hasBody = method === "POST" || method === "PUT";

  const raw = useMemo(() => {
    const safePath = path.trim() || "/";
    const lines = [`${method} ${safePath} HTTP/1.1`, `Host: ${HOST}`];
    if (header.key) lines.push(`${header.key}: ${header.value}`);
    if (hasBody) {
      lines.push("Content-Type: application/json");
      lines.push("Content-Length: 19");
    }
    lines.push("");
    lines.push(hasBody ? '{"name":"attacker"}' : "");
    return lines.join("\n");
  }, [method, path, header, hasBody]);

  return (
    <div className="my-6 rounded-lg border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="w-32">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Method</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[10rem] flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Path</span>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="w-44">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Header</span>
          <select
            value={headerIdx}
            onChange={(e) => setHeaderIdx(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-input bg-background px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {HEADERS.map((h, i) => (
              <option key={h.label} value={i}>
                {h.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Request on the wire
          </div>
          <pre className="overflow-x-auto rounded-md border bg-background p-3 font-mono text-xs leading-relaxed">
            {raw}
          </pre>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowRight className="size-4 shrink-0 text-primary" />
          <span>Server replies with</span>
          <code className="rounded bg-primary/10 px-2 py-0.5 font-mono font-semibold text-primary">
            {responseLine(method)}
          </code>
        </div>
      </div>
    </div>
  );
}
