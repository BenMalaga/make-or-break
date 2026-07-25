/**
 * Runs real Python in the browser with Pyodide (CPython compiled to
 * WebAssembly). Pyodide is loaded on demand from a public CDN the first time the
 * user runs code, so the Build page stays light until it is used. Everything
 * executes client-side; nothing is sent anywhere.
 */

const PYODIDE_VERSION = "0.26.4";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

type Pyodide = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
  FS: { writeFile: (path: string, data: string, opts?: { encoding?: string }) => void };
};

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<Pyodide>;
    __mob_pyodide?: Promise<Pyodide>;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load the Python runtime."));
    document.head.appendChild(s);
  });
}

/** Boot Pyodide once and cache the promise on window. */
export function bootPython(): Promise<Pyodide> {
  if (window.__mob_pyodide) return window.__mob_pyodide;
  window.__mob_pyodide = (async () => {
    if (!window.loadPyodide) await loadScript(`${INDEX_URL}pyodide.js`);
    if (!window.loadPyodide) throw new Error("Python runtime unavailable.");
    return window.loadPyodide({ indexURL: INDEX_URL });
  })();
  return window.__mob_pyodide;
}

export interface RunResult {
  output: string;
  ok: boolean;
}

/** Run a snippet, capturing stdout and stderr into one string. */
export async function runPython(code: string): Promise<RunResult> {
  return runPythonFiles([{ name: "main.py", content: code }], "main.py");
}

/**
 * Run a multi-file Python project: writes every .py file into Pyodide's
 * filesystem so `import <module>` works between them, then runs the entry file.
 * User modules are dropped from the import cache each run so edits take effect.
 */
export async function runPythonFiles(
  files: { name: string; content: string }[],
  entryName: string,
): Promise<RunResult> {
  const py = await bootPython();
  let output = "";
  py.setStdout({ batched: (s) => (output += s) });
  py.setStderr({ batched: (s) => (output += s) });

  const pyFiles = files.filter((f) => f.name.endsWith(".py"));
  const modules = pyFiles
    .filter((f) => f.name !== entryName)
    .map((f) => f.name.replace(/\.py$/, "").replace(/\//g, "."));

  try {
    for (const f of files) {
      py.FS.writeFile(f.name, f.content, { encoding: "utf8" });
    }
    // Re-import edited modules on every run instead of using a stale cache.
    if (modules.length) {
      await py.runPythonAsync(
        `import sys, importlib\nimportlib.invalidate_caches()\nfor _m in ${JSON.stringify(modules)}:\n    sys.modules.pop(_m, None)\n`,
      );
    }
    const entry = files.find((f) => f.name === entryName) ?? files[0];
    await py.runPythonAsync(entry?.content ?? "");
    return { output, ok: true };
  } catch (err) {
    output += (output && !output.endsWith("\n") ? "\n" : "") + String(err);
    return { output, ok: false };
  }
}
