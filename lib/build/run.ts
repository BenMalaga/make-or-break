import { runPython, runPythonFiles } from "./python";
import { runPowerShell } from "./powershell";

export interface CodeFile {
  name: string;
  content: string;
}

export type Language =
  | "python"
  | "javascript"
  | "powershell"
  | "c"
  | "cpp"
  | "csharp"
  | "go"
  | "rust"
  | "java";

export interface RunOutput {
  output: string;
  ok: boolean;
}

interface LangSpec {
  id: Language;
  label: string;
  monaco: string;
  file: string;
  /** How the run is echoed in the terminal, cosmetic. */
  cmd: string;
  /** Piston language name, for compiled languages run on the free public runner. */
  piston?: string;
}

export const LANGUAGES: LangSpec[] = [
  { id: "python", label: "Python", monaco: "python", file: "main.py", cmd: "python main.py" },
  { id: "javascript", label: "JavaScript", monaco: "javascript", file: "main.js", cmd: "node main.js" },
  { id: "powershell", label: "PowerShell", monaco: "powershell", file: "script.ps1", cmd: "pwsh ./script.ps1" },
  { id: "c", label: "C", monaco: "c", file: "main.c", cmd: "gcc main.c -o main && ./main", piston: "c" },
  { id: "cpp", label: "C++", monaco: "cpp", file: "main.cpp", cmd: "g++ main.cpp -o main && ./main", piston: "c++" },
  { id: "csharp", label: "C#", monaco: "csharp", file: "main.cs", cmd: "mcs main.cs && mono main.exe", piston: "csharp" },
  { id: "go", label: "Go", monaco: "go", file: "main.go", cmd: "go run main.go", piston: "go" },
  { id: "rust", label: "Rust", monaco: "rust", file: "main.rs", cmd: "rustc main.rs && ./main", piston: "rust" },
  { id: "java", label: "Java", monaco: "java", file: "Main.java", cmd: "javac Main.java && java Main", piston: "java" },
];

export function langSpec(id: Language): LangSpec {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}

export const STARTERS: Record<Language, string> = {
  python: `# Write Python here and hit Run (or Ctrl+Enter).
# Output prints in the terminal.

def is_prime(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            return False
    return True

print("primes under 50:", [n for n in range(2, 50) if is_prime(n)])
`,
  javascript: `// Write JavaScript here and hit Run (or Ctrl+Enter).

function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

const primes = [];
for (let n = 2; n < 50; n++) if (isPrime(n)) primes.push(n);
console.log("primes under 50:", primes.join(", "));
`,
  powershell: `# Write PowerShell here and hit Run (or Ctrl+Enter).
# This is a browser practice PowerShell that runs common commands.

$name = "world"
Write-Output "Hello, $name"

# The pipeline: keep the even numbers from 1 to 20, then square them
1..20 | Where-Object { $_ % 2 -eq 0 } | ForEach-Object { $_ * $_ }

# Objects flow through the pipeline, so fields are read by name
Get-Process | Where-Object { $_.CPU -gt 20 } | Sort-Object CPU
`,
  c: `#include <stdio.h>

int main(void) {
    for (int n = 2; n < 50; n++) {
        int prime = 1;
        for (int d = 2; d * d <= n; d++)
            if (n % d == 0) prime = 0;
        if (prime) printf("%d ", n);
    }
    printf("\\n");
    return 0;
}
`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> primes;
    for (int n = 2; n < 50; n++) {
        bool prime = true;
        for (int d = 2; d * d <= n; d++)
            if (n % d == 0) prime = false;
        if (prime) primes.push_back(n);
    }
    for (int x : primes) cout << x << " ";
    cout << endl;
}
`,
  csharp: `using System;

class Program {
    static void Main() {
        for (int n = 2; n < 50; n++) {
            bool prime = true;
            for (int d = 2; d * d <= n; d++)
                if (n % d == 0) prime = false;
            if (prime) Console.Write(n + " ");
        }
        Console.WriteLine();
    }
}
`,
  go: `package main

import "fmt"

func main() {
    for n := 2; n < 50; n++ {
        prime := true
        for d := 2; d*d <= n; d++ {
            if n%d == 0 {
                prime = false
            }
        }
        if prime {
            fmt.Print(n, " ")
        }
    }
    fmt.Println()
}
`,
  rust: `fn main() {
    for n in 2..50 {
        let mut prime = true;
        let mut d = 2;
        while d * d <= n {
            if n % d == 0 { prime = false; }
            d += 1;
        }
        if prime { print!("{} ", n); }
    }
    println!();
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        for (int n = 2; n < 50; n++) {
            boolean prime = true;
            for (int d = 2; d * d <= n; d++)
                if (n % d == 0) prime = false;
            if (prime) System.out.print(n + " ");
        }
        System.out.println();
    }
}
`,
};

// --- JavaScript: a sandboxed worker with a timeout, so a loop cannot hang the tab.
// The worker inherits the page origin, so before running a snippet we revoke its
// network reach (fetch/XHR/WebSocket/importScripts/beacon). A teaching snippet
// never needs the network, and this stops a shared/stored snippet from making a
// credentialed same-origin request (e.g. /api/me/export) and posting the result
// off-origin. Compute stays fully available.
const JS_WORKER = `
const _blocked = () => { throw new Error("Network access is disabled in the sandbox."); };
for (const k of ["fetch", "importScripts", "XMLHttpRequest", "WebSocket", "EventSource", "Request"]) {
  try { Object.defineProperty(self, k, { value: k === "fetch" || k === "importScripts" ? _blocked : undefined, configurable: false, writable: false }); } catch (e) {}
}
try { if (self.navigator) self.navigator.sendBeacon = _blocked; } catch (e) {}
self.onmessage = (e) => {
  const logs = [];
  const fmt = (a) => { if (typeof a === "string") return a; try { return JSON.stringify(a); } catch { return String(a); } };
  const cap = (...args) => logs.push(args.map(fmt).join(" "));
  const console = { log: cap, info: cap, warn: cap, error: cap, debug: cap };
  let ok = true;
  try { new Function("console", e.data)(console); }
  catch (err) { logs.push(String(err && err.stack ? err.stack : err)); ok = false; }
  self.postMessage({ output: logs.join("\\n") || "(no output)", ok });
};
`;

function runJavaScript(code: string, timeoutMs = 5000): Promise<RunOutput> {
  return new Promise((resolve) => {
    let url = "";
    let worker: Worker;
    try {
      url = URL.createObjectURL(new Blob([JS_WORKER], { type: "application/javascript" }));
      worker = new Worker(url);
    } catch {
      resolve({ output: "Could not start the JavaScript runtime.", ok: false });
      return;
    }
    const done = (out: RunOutput) => {
      clearTimeout(timer);
      worker.terminate();
      if (url) URL.revokeObjectURL(url);
      resolve(out);
    };
    const timer = setTimeout(
      () => done({ output: "Timed out after 5s (possible infinite loop).", ok: false }),
      timeoutMs,
    );
    worker.onmessage = (e) => done(e.data as RunOutput);
    worker.onerror = (e) => done({ output: String(e.message ?? "Error"), ok: false });
    worker.postMessage(code);
  });
}

// --- Compiled languages: Wandbox, a free, keyless, CORS-enabled runner that
// compiles and runs them on its servers. The public Piston API went whitelist
// only in early 2026, so this replaced it.
const WANDBOX = "https://wandbox.org/api";
const WANDBOX_LANG: Partial<Record<Language, string>> = {
  c: "C",
  cpp: "C++",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  java: "Java",
};

let compilersCache: { name: string; language: string }[] | null = null;
async function wandboxCompilers() {
  if (!compilersCache) {
    const res = await fetch(`${WANDBOX}/list.json`);
    compilersCache = await res.json();
  }
  return compilersCache!;
}

async function runWandbox(spec: LangSpec, code: string): Promise<RunOutput> {
  const lang = WANDBOX_LANG[spec.id];
  if (!lang) return { output: `Running ${spec.label} is not supported yet.`, ok: false };

  let compilers: { name: string; language: string }[];
  try {
    compilers = await wandboxCompilers();
  } catch {
    return { output: "Could not reach the code runner. Check your connection.", ok: false };
  }
  // Wandbox lists newest first, so the first match is the current compiler.
  const comp = compilers.find((c) => c.language === lang);
  if (!comp) return { output: `No compiler available for ${spec.label}.`, ok: false };

  let res: Response;
  try {
    res = await fetch(`${WANDBOX}/compile.json`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, compiler: comp.name, stdin: "" }),
    });
  } catch {
    return { output: "Could not reach the code runner. Check your connection.", ok: false };
  }
  if (!res.ok) {
    return { output: `The code runner returned ${res.status}. Try again in a moment.`, ok: false };
  }
  const data = await res.json();
  const parts = [data.compiler_error, data.program_output, data.program_error].filter(Boolean);
  const ok = String(data.status) === "0";
  return { output: parts.join("\n").trim() || "(no output)", ok };
}

export async function runCode(language: Language, code: string): Promise<RunOutput> {
  if (language === "python") return runPython(code);
  if (language === "javascript") return runJavaScript(code);
  if (language === "powershell") return runPowerShell(code);
  return runWandbox(langSpec(language), code);
}

/**
 * Run a multi-file project. Python writes each file into Pyodide's filesystem so
 * `import` works between them. JavaScript runs the other files in the same scope
 * before the entry (a simple shared-code model, not ES modules). Compiled
 * languages run the entry file only for now.
 */
export async function runFiles(
  language: Language,
  files: CodeFile[],
  entryName: string,
): Promise<RunOutput> {
  if (language === "python") return runPythonFiles(files, entryName);

  const entry = files.find((f) => f.name === entryName) ?? files[0];
  if (!entry) return { output: "(no file to run)", ok: false };

  if (language === "javascript") {
    const others = files.filter((f) => f !== entry && f.name.endsWith(".js"));
    const combined = [...others.map((f) => `// ${f.name}\n${f.content}`), entry.content].join(
      "\n\n",
    );
    return runJavaScript(combined);
  }
  if (language === "powershell") return runPowerShell(entry.content);
  return runWandbox(langSpec(language), entry.content);
}
