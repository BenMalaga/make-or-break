"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Layer {
  n: number;
  name: string;
  pdu: string;
  examples: string;
  attack: string;
}

const LAYERS: Layer[] = [
  { n: 7, name: "Application", pdu: "Data", examples: "HTTP, DNS, SSH, SMTP", attack: "Web app flaws, credential attacks, phishing payloads" },
  { n: 6, name: "Presentation", pdu: "Data", examples: "TLS, JPEG, ASCII", attack: "TLS downgrade, deserialization, encoding tricks" },
  { n: 5, name: "Session", pdu: "Data", examples: "NetBIOS, RPC, sockets", attack: "Session hijacking, fixation" },
  { n: 4, name: "Transport", pdu: "Segment", examples: "TCP, UDP", attack: "SYN scans, port scanning, TCP reset injection" },
  { n: 3, name: "Network", pdu: "Packet", examples: "IP, ICMP, routing", attack: "IP spoofing, routing games, ICMP tunneling" },
  { n: 2, name: "Data Link", pdu: "Frame", examples: "Ethernet, ARP, MAC", attack: "ARP spoofing, MAC flooding, VLAN hopping" },
  { n: 1, name: "Physical", pdu: "Bit", examples: "Cables, Wi-Fi, fiber", attack: "Wiretapping, RF jamming, physical access" },
];

/**
 * Interactive OSI model: click a layer to see its PDU, example protocols, and
 * where attackers operate at that layer. Used via <Diagram type="osi" />.
 */
export function OsiModel() {
  const [active, setActive] = useState(4);
  const layer = LAYERS.find((l) => l.n === active)!;

  return (
    <div className="my-6 grid gap-4 md:grid-cols-[1fr_1.1fr]">
      <div className="space-y-1.5">
        {LAYERS.map((l) => (
          <button
            key={l.n}
            type="button"
            onClick={() => setActive(l.n)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
              active === l.n
                ? "border-primary bg-primary/10"
                : "hover:border-primary/40 hover:bg-accent/40",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                active === l.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {l.n}
            </span>
            <span className="text-sm font-medium">{l.name}</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{l.pdu}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Layer {layer.n}
          </span>
          <h4 className="text-base font-semibold">{layer.name}</h4>
        </div>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Protocol data unit</dt>
            <dd className="font-mono">{layer.pdu}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Example protocols</dt>
            <dd className="font-mono">{layer.examples}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Where attackers operate</dt>
            <dd className="text-muted-foreground">{layer.attack}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
