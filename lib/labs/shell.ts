/**
 * A tiny, safe, in-browser shell evaluator for the command-injection lab. It
 * models the one bug that matters: an app that builds a shell command by pasting
 * user input into a string, so shell metacharacters in that input start a second
 * command. Nothing here touches a real shell or filesystem. It runs a handful of
 * read-only commands against a fixed virtual filesystem so the classic payloads
 * (`; cat /flag.txt`, `$(whoami)`) actually produce output.
 */

export interface InjectedResult {
  cmd: string;
  output: string;
  ok: boolean;
}

export interface ShellRunResult {
  /** The full command string the app built, input included. */
  command: string;
  /** The host portion that the intended `ping` ran against. */
  host: string;
  /** Simulated ping output for the host portion. */
  pingOutput: string;
  /** Every command the attacker smuggled in, with its output. */
  injected: InjectedResult[];
  /** True once at least one injected command actually ran. */
  solved: boolean;
}

const FLAG = "MOB{c0mmand_1nj3ct10n_rce}";

// The virtual filesystem the injected commands read from. Read-only.
const FILES: Record<string, string> = {
  "/flag.txt": FLAG,
  "/etc/hostname": "web01",
  "/etc/passwd": [
    "root:x:0:0:root:/root:/bin/bash",
    "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin",
    "postgres:x:114:120:PostgreSQL:/var/lib/postgresql:/bin/bash",
  ].join("\n"),
  "/var/www/html/config.php": "<?php $DB_PASS = 'sup3rs3cr3t'; // do not commit",
};

const DIRS: Record<string, string[]> = {
  "/": ["etc", "var", "home", "flag.txt"],
  "/var/www/html": ["index.php", "config.php", "uploads"],
  "/etc": ["hostname", "passwd", "hosts"],
};

/** Run one smuggled command against the virtual filesystem. */
function runOne(raw: string): InjectedResult {
  const cmd = raw.trim();
  if (!cmd) return { cmd: raw, output: "", ok: false };
  const [name, ...args] = cmd.split(/\s+/);

  switch (name) {
    case "whoami":
      return { cmd, output: "www-data", ok: true };
    case "id":
      return { cmd, output: "uid=33(www-data) gid=33(www-data) groups=33(www-data)", ok: true };
    case "pwd":
      return { cmd, output: "/var/www/html", ok: true };
    case "hostname":
      return { cmd, output: "web01", ok: true };
    case "uname":
      return { cmd, output: "Linux web01 5.15.0-91-generic x86_64 GNU/Linux", ok: true };
    case "echo":
      return { cmd, output: args.join(" "), ok: true };
    case "ls": {
      const path = args.find((a) => !a.startsWith("-")) ?? "/var/www/html";
      const key = normalize(path);
      if (DIRS[key]) return { cmd, output: DIRS[key].join("  "), ok: true };
      if (FILES[key]) return { cmd, output: key, ok: true };
      return { cmd, output: `ls: cannot access '${path}': No such file or directory`, ok: false };
    }
    case "cat": {
      const path = args.find((a) => !a.startsWith("-"));
      if (!path) return { cmd, output: "cat: missing operand", ok: false };
      const key = normalize(path);
      if (FILES[key] !== undefined) return { cmd, output: FILES[key], ok: true };
      return { cmd, output: `cat: ${path}: No such file or directory`, ok: false };
    }
    default:
      return { cmd, output: `sh: 1: ${name}: not found`, ok: false };
  }
}

/** Collapse a path to an absolute key the maps use. */
function normalize(path: string): string {
  if (!path.startsWith("/")) return "/var/www/html/" + path;
  // strip a trailing slash except for root
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** Pull `$(...)` and backtick command substitutions out of a string. */
function extractSubstitutions(input: string): string[] {
  const subs: string[] = [];
  const re = /\$\(([^)]*)\)|`([^`]*)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const inner = (m[1] ?? m[2] ?? "").trim();
    if (inner) subs.push(inner);
  }
  return subs;
}

/** Split input into the intended host and any chained commands. */
function splitChain(input: string): { host: string; extra: string[] } {
  // top-level separators: ; && || | and a literal newline
  const parts = input
    .split(/\s*(?:;|\|\||&&|\||\n)+\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { host: input.trim(), extra: [] };
  return { host: parts[0], extra: parts.slice(1) };
}

const IP_RE = /^[a-z0-9.-]+$/i;

function pingOutput(host: string): string {
  const h = host.trim() || "(empty)";
  if (!IP_RE.test(h)) {
    return `ping: ${h}: Name or service not known`;
  }
  return [
    `PING ${h} (${h}): 56 data bytes`,
    `64 bytes from ${h}: icmp_seq=0 ttl=117 time=11.4 ms`,
    ``,
    `--- ${h} ping statistics ---`,
    `1 packets transmitted, 1 packets received, 0.0% packet loss`,
  ].join("\n");
}

/**
 * Simulate the vulnerable endpoint: it builds `ping -c 1 <input>` and hands the
 * whole string to a shell. Returns the ping result plus anything the input
 * smuggled in through separators or command substitution.
 */
export function runNetTool(userInput: string): ShellRunResult {
  const command = `ping -c 1 ${userInput}`;
  const { host, extra } = splitChain(userInput);

  // Substitutions can hide inside the host token, e.g. `$(whoami)`.
  const subs = extractSubstitutions(userInput);
  const injectedCmds = [...subs, ...extra];

  const injected = injectedCmds.map(runOne);
  const solved = injected.some((r) => r.ok);

  // If the host itself was a pure substitution like `$(id)`, ping has nothing
  // real to resolve; show a lookup failure so the reason is visible.
  const hostForPing = subs.length && /^\$\(|^`/.test(host) ? "" : host;

  return {
    command,
    host,
    pingOutput: pingOutput(hostForPing),
    injected,
    solved,
  };
}

export { FLAG as COMMAND_INJECTION_FLAG };
