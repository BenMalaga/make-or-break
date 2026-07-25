import type { GlossaryModule } from "./types";

/** Offensive Security terms. See ./types.ts for the rules an entry must follow. */
export const OFFENSIVE: GlossaryModule = {
  "port-scanning": {
    term: "port scanning",
    definition:
      "Probing a host's ports to learn which ones have something listening. It is usually the first useful thing done to a target, because you cannot attack a service you do not know exists.",
    seeAlso: ["port", "syn", "nmap"],
  },
  nmap: {
    term: "nmap",
    definition:
      "The standard port scanner. It sends probes to a host's ports and reports which are open, and often what software is answering.",
    seeAlso: ["port-scanning"],
  },
  enumeration: {
    term: "enumeration",
    definition:
      "Systematically listing what a target exposes: hosts, ports, services, versions, users, shares. It is the step between finding a target and attacking it.",
    seeAlso: ["port-scanning"],
  },
  vulnerability: {
    term: "vulnerability",
    definition:
      "A flaw that lets someone make software do something it should not. A flaw only matters if it is reachable, which is why mapping comes first.",
    seeAlso: ["exploit"],
  },
  exploit: {
    term: "exploit",
    definition:
      "Code or a technique that takes advantage of a specific vulnerability to gain access or control.",
    seeAlso: ["vulnerability", "payload"],
  },
  "kill-chain": {
    term: "kill chain",
    definition:
      "A model naming the stages of an intrusion in order, from researching the target through to acting on the objective. It is useful mainly as shared vocabulary for where you are in an attack.",
    seeAlso: ["enumeration"],
  },
};
