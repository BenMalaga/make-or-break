/**
 * A simulated Unix shell. Pure logic, no DOM: given a filesystem, a working
 * directory, and a line of input, it returns output and the next state. The
 * terminal component (components/mdx/terminal.tsx) renders it.
 *
 * This is a teaching sandbox, not a real shell. It implements enough of the
 * common commands that a lesson can say "try `ls -la`" and have it work, against
 * a filesystem the lesson controls. Nothing here touches the real machine.
 */

export interface FileNode {
  type: "file";
  content: string;
  /** Octal-ish mode string for `ls -l`, e.g. "rw-r--r--". */
  mode?: string;
}
export interface DirNode {
  type: "dir";
  children: Record<string, FSNode>;
  mode?: string;
}
export type FSNode = FileNode | DirNode;

export interface ShellState {
  root: DirNode;
  /** Absolute path segments of the working directory, e.g. ["home", "hacker"]. */
  cwd: string[];
  user: string;
  host: string;
}

export interface RunResult {
  output: string;
  state: ShellState;
  /** Set by `clear` so the component can wipe scrollback. */
  clear?: boolean;
}

function isDir(n: FSNode | null): n is DirNode {
  return !!n && n.type === "dir";
}

/** Resolve a target path against the cwd into absolute segments. Null on `..` past root. */
export function resolvePath(cwd: string[], user: string, target: string): string[] | null {
  let segs: string[];
  if (target === "" || target === undefined) segs = [...cwd];
  else if (target === "~" || target.startsWith("~/")) {
    const rest = target.slice(1).split("/").filter(Boolean);
    segs = ["home", user, ...rest];
  } else if (target.startsWith("/")) {
    segs = target.split("/").filter(Boolean);
  } else {
    segs = [...cwd, ...target.split("/").filter(Boolean)];
  }
  const out: string[] = [];
  for (const s of segs) {
    if (s === ".") continue;
    if (s === "..") {
      if (out.length === 0) return null;
      out.pop();
    } else out.push(s);
  }
  return out;
}

export function nodeAt(root: DirNode, segs: string[]): FSNode | null {
  let node: FSNode = root;
  for (const s of segs) {
    if (!isDir(node)) return null;
    const next: FSNode | undefined = node.children[s];
    if (!next) return null;
    node = next;
  }
  return node;
}

function pathStr(segs: string[], user: string): string {
  if (segs.length >= 2 && segs[0] === "home" && segs[1] === user) {
    const rest = segs.slice(2);
    return rest.length ? `~/${rest.join("/")}` : "~";
  }
  return "/" + segs.join("/");
}

export function prompt(state: ShellState): string {
  return `${state.user}@${state.host}:${pathStr(state.cwd, state.user)}$`;
}

type Cmd = (args: string[], state: ShellState) => { output: string; state?: ShellState; clear?: boolean };

const COMMANDS: Record<string, Cmd> = {
  help: () => ({
    output:
      "Simulated shell. Available commands:\n" +
      "  ls [-l] [-a] [path]   list a directory\n" +
      "  cd [path]             change directory\n" +
      "  pwd                   print working directory\n" +
      "  cat <file>            print a file\n" +
      "  echo <text>           print text\n" +
      "  grep <pat> <file>     print matching lines\n" +
      "  whoami / hostname / uname / id / date\n" +
      "  history               command history\n" +
      "  clear                 clear the screen\n" +
      "This is a sandbox for practice. It is not a real machine.",
  }),

  pwd: (_a, state) => ({ output: "/" + state.cwd.join("/") }),

  whoami: (_a, state) => ({ output: state.user }),
  hostname: (_a, state) => ({ output: state.host }),
  id: (_a, state) => ({ output: `uid=1000(${state.user}) gid=1000(${state.user}) groups=1000(${state.user})` }),
  uname: (args) => ({ output: args.includes("-a") ? "Linux makeorbreak 6.1.0 x86_64 GNU/Linux" : "Linux" }),
  date: () => ({ output: "date is not available in the sandbox" }),
  echo: (args) => ({ output: args.join(" ") }),

  ls: (args, state) => {
    const flags = args.filter((a) => a.startsWith("-")).join("");
    const paths = args.filter((a) => !a.startsWith("-"));
    const long = flags.includes("l");
    const all = flags.includes("a");
    const target = paths[0] ?? "";
    const segs = resolvePath(state.cwd, state.user, target);
    if (!segs) return { output: "ls: cannot access '..': No such file or directory" };
    const node = nodeAt(state.root, segs);
    if (!node) return { output: `ls: cannot access '${target || "."}': No such file or directory` };
    if (node.type === "file") return { output: target };
    let names = Object.keys(node.children);
    if (!all) names = names.filter((n) => !n.startsWith("."));
    names.sort();
    if (all) names = [".", "..", ...names];
    if (!long) return { output: names.join("  ") };
    const lines = names.map((name) => {
      const child = name === "." || name === ".." ? node : node.children[name];
      const isD = child.type === "dir";
      const mode = (isD ? "d" : "-") + (child.mode ?? (isD ? "rwxr-xr-x" : "rw-r--r--"));
      const size = child.type === "file" ? child.content.length : 4096;
      return `${mode} 1 ${state.user} ${state.user} ${String(size).padStart(5)} ${name}`;
    });
    return { output: lines.join("\n") };
  },

  cd: (args, state) => {
    const target = args[0] ?? "~";
    const segs = resolvePath(state.cwd, state.user, target);
    if (!segs) return { output: "cd: cannot go above /" };
    const node = nodeAt(state.root, segs);
    if (!node) return { output: `cd: ${target}: No such file or directory` };
    if (node.type !== "dir") return { output: `cd: ${target}: Not a directory` };
    return { output: "", state: { ...state, cwd: segs } };
  },

  cat: (args, state) => {
    if (!args[0]) return { output: "cat: missing file operand" };
    const outputs: string[] = [];
    for (const p of args) {
      const segs = resolvePath(state.cwd, state.user, p);
      const node = segs ? nodeAt(state.root, segs) : null;
      if (!node) outputs.push(`cat: ${p}: No such file or directory`);
      else if (node.type === "dir") outputs.push(`cat: ${p}: Is a directory`);
      else outputs.push(node.content);
    }
    return { output: outputs.join("\n") };
  },

  grep: (args, state) => {
    const positional = args.filter((a) => !a.startsWith("-"));
    const [pattern, file] = positional;
    if (!pattern || !file) return { output: "usage: grep <pattern> <file>" };
    const segs = resolvePath(state.cwd, state.user, file);
    const node = segs ? nodeAt(state.root, segs) : null;
    if (!node || node.type !== "file") return { output: `grep: ${file}: No such file` };
    const hits = node.content.split("\n").filter((l) => l.toLowerCase().includes(pattern.toLowerCase()));
    return { output: hits.join("\n") };
  },

  clear: (_a, state) => ({ output: "", state, clear: true }),
};

/** Run one input line. Returns output plus the next state. */
export function runLine(state: ShellState, line: string): RunResult {
  const trimmed = line.trim();
  if (!trimmed) return { output: "", state };
  const [name, ...args] = trimmed.split(/\s+/);
  const cmd = COMMANDS[name];
  if (!cmd) {
    return { output: `${name}: command not found. Type 'help' for a list.`, state };
  }
  const res = cmd(args, state);
  return { output: res.output, state: res.state ?? state, clear: res.clear };
}

export const COMMAND_NAMES = Object.keys(COMMANDS);
