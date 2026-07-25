import type { GlossaryModule } from "./types";

/** Systems and Linux terms. See ./types.ts for the rules an entry must follow. */
export const SYSTEMS: GlossaryModule = {
  shell: {
    term: "shell",
    definition:
      "The program that reads typed commands and runs them. When people say they 'got a shell' on a machine, they mean they can run commands on it.",
    seeAlso: ["ssh", "daemon"],
  },
  ssh: {
    term: "SSH",
    definition:
      "Secure Shell. A protocol for logging in to another machine and running commands on it over an encrypted connection. It normally listens on port 22.",
    seeAlso: ["shell", "port", "daemon"],
  },
  daemon: {
    term: "daemon",
    definition:
      "A program that runs in the background waiting to serve requests, rather than being started by a person each time. Names often end in d, such as sshd.",
    seeAlso: ["server", "listening"],
  },
  kali: {
    term: "Kali Linux",
    definition:
      "A Linux distribution that ships with security tools already installed. It is a convenience, not a requirement; the tools run anywhere.",
    seeAlso: ["shell"],
  },
  root: {
    term: "root",
    definition:
      "The all-powerful administrative account on a Unix or Linux system. Root can read, change, or delete anything, which is why gaining it is usually the goal of an attack.",
    seeAlso: ["shell"],
  },
};
