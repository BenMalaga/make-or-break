import type { Machine } from "@prisma/client";
import { Container, HardDrive, Cloud, Globe, Search } from "lucide-react";
import { CommandCard } from "@/components/mdx/command-card";
import { Callout } from "@/components/mdx/callout";

/**
 * Renders the concrete "how to stand up this target" instructions based on the
 * machine's targetType. Phase A = DOCKER + BYO_VM. Phase B (HOSTED) shows a
 * spawn placeholder until the orchestrator ships.
 */
export function TargetSetup({ machine }: { machine: Machine }) {
  if (machine.targetType === "DOCKER") {
    const url = `http://localhost:${machine.targetPort ?? 80}${machine.targetHttpPath ?? "/"}`;
    return (
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Container className="size-5 text-info" /> Set up the target
        </h2>
        <p className="text-sm text-muted-foreground">
          Spin this up locally with Docker, then attack it from your Kali box.
        </p>
        {machine.dockerRunCmd ? (
          <CommandCard command={machine.dockerRunCmd} title="docker" explain="Run once. Ctrl-C or docker stop to tear it down." />
        ) : null}
        <p className="text-sm">
          Then hit it at{" "}
          <a href={url} className="font-mono text-primary underline underline-offset-4" target="_blank" rel="noreferrer">
            {url}
          </a>
        </p>
      </section>
    );
  }

  if (machine.targetType === "BYO_VM") {
    return (
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <HardDrive className="size-5 text-medium" /> Set up the target
        </h2>
        <p className="text-sm text-muted-foreground">
          Download the VulnHub image, import it into your hypervisor (UTM /
          VirtualBox / VMware), and boot it on a host-only or NAT network.
        </p>
        <div className="rounded-lg border bg-card p-4 text-sm">
          <dl className="space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Image</dt>
              <dd className="font-medium">{machine.byoVmName ?? machine.name}</dd>
            </div>
            {machine.byoVmSourceUrl ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Download</dt>
                <dd>
                  <a href={machine.byoVmSourceUrl} className="text-primary underline underline-offset-4" target="_blank" rel="noreferrer">
                    VulnHub entry
                  </a>
                </dd>
              </div>
            ) : null}
            {machine.byoVmSha256 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">SHA-256</dt>
                <dd className="max-w-[60%] truncate font-mono text-xs">{machine.byoVmSha256}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        {machine.byoVmImportNotes ? (
          <Callout type="tip" title="Import notes">{machine.byoVmImportNotes}</Callout>
        ) : null}
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Search className="size-4" /> Find the target IP on your network
          </p>
          <CommandCard command="sudo netdiscover -r 192.168.56.0/24" title="attacker@kali" explain="Or: sudo arp-scan --localnet, or nmap -sn 192.168.56.0/24" />
        </div>
      </section>
    );
  }

  // HOSTED (Phase B)
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Cloud className="size-5 text-primary" /> Hosted machine
      </h2>
      <Callout type="info" title="Coming in Phase B">
        Hosted machines spin up an isolated per-user instance you reach over
        WireGuard VPN. The orchestration service is on the roadmap. For now this
        machine is defined but not yet spawnable.
      </Callout>
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <Globe className="size-4" /> Spawn / VPN controls appear here once the orchestrator is live.
      </div>
    </section>
  );
}
