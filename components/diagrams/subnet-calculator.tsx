"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Interactive IPv4 subnet calculator. Pure client-side math, no deps.
 * Used inline in the CIDR/subnetting lesson via <Diagram type="subnet" />.
 */

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const v = Number(p);
    if (v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function intToIp(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 0xff).join(".");
}

export function SubnetCalculator() {
  const [ip, setIp] = useState("10.10.14.0");
  const [cidr, setCidr] = useState(24);

  const result = useMemo(() => {
    const base = ipToInt(ip);
    if (base === null) return null;
    const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
    const network = (base & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - cidr);
    const usable = cidr >= 31 ? (cidr === 31 ? 2 : 1) : total - 2;
    const firstHost = cidr >= 31 ? network : (network + 1) >>> 0;
    const lastHost = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
    return {
      mask: intToIp(mask),
      wildcard: intToIp(~mask >>> 0),
      network: intToIp(network),
      broadcast: intToIp(broadcast),
      firstHost: intToIp(firstHost),
      lastHost: intToIp(lastHost),
      total,
      usable,
    };
  }, [ip, cidr]);

  const rows: [string, string][] = result
    ? [
        ["Network address", result.network],
        ["Usable range", `${result.firstHost} - ${result.lastHost}`],
        ["Broadcast", result.broadcast],
        ["Subnet mask", result.mask],
        ["Wildcard", result.wildcard],
        ["Total / usable hosts", `${result.total.toLocaleString()} / ${result.usable.toLocaleString()}`],
      ]
    : [];

  return (
    <div className="my-6 rounded-lg border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">IP address</span>
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className={cn(
              "h-9 w-full rounded-md border bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              result === null ? "border-destructive" : "border-input",
            )}
          />
        </label>
        <label className="w-40">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Prefix /{cidr}</span>
          <input
            type="range"
            min={0}
            max={32}
            value={cidr}
            onChange={(e) => setCidr(Number(e.target.value))}
            className="h-9 w-full accent-[hsl(var(--primary))]"
          />
        </label>
      </div>

      {result ? (
        <dl className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 bg-card px-3 py-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-mono text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-destructive">Enter a valid IPv4 address (e.g. 10.10.14.0).</p>
      )}
    </div>
  );
}
