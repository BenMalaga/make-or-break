"use client";

import { SubnetCalculator } from "@/components/diagrams/subnet-calculator";
import { OsiModel } from "@/components/diagrams/osi-model";
import { ChmodCalculator } from "@/components/diagrams/chmod-calculator";
import { TcpHandshake } from "@/components/diagrams/tcp-handshake";
import { HttpRequestBuilder } from "@/components/diagrams/http-request-builder";
import { NatPath } from "@/components/diagrams/nat-path";
import { PortStates } from "@/components/diagrams/port-states";

/**
 * Registry of interactive diagrams usable from MDX via <Diagram type="..." />.
 * To add one: build a client component under components/diagrams/, then add it
 * to this map. Unknown types render a graceful placeholder (so a lesson that
 * references a not-yet-built diagram still renders).
 */
const REGISTRY: Record<string, React.ComponentType> = {
  subnet: SubnetCalculator,
  osi: OsiModel,
  chmod: ChmodCalculator,
  "tcp-handshake": TcpHandshake,
  "http-request": HttpRequestBuilder,
  "nat-path": NatPath,
  ports: PortStates,
};

export function Diagram({ type }: { type: string }) {
  const Component = REGISTRY[type];
  if (!Component) {
    return (
      <div className="my-6 rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        Interactive diagram <code className="font-mono">{type}</code> is not available yet.
      </div>
    );
  }
  return <Component />;
}
