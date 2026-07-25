"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Play,
  Loader2,
  Trash2,
  Download,
  PanelRight,
  PanelLeft,
  PanelBottom,
  PanelTop,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  runFiles,
  LANGUAGES,
  STARTERS,
  langSpec,
  type Language,
  type CodeFile,
} from "@/lib/build/run";
import { downloadText } from "@/lib/download";
import { useBuildContext, useCopilotControl } from "@/lib/ai/store";
import { CodeEditor } from "./code-editor";
import { FileTabs } from "./file-tabs";
import { Terminal, type TerminalHandle } from "@/components/mdx/terminal";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

type Layout = "terminal-right" | "terminal-left" | "terminal-bottom" | "terminal-top";

const LAYOUTS: { id: Layout; icon: typeof PanelRight; label: string }[] = [
  { id: "terminal-right", icon: PanelRight, label: "Terminal right" },
  { id: "terminal-left", icon: PanelLeft, label: "Terminal left" },
  { id: "terminal-bottom", icon: PanelBottom, label: "Terminal bottom" },
  { id: "terminal-top", icon: PanelTop, label: "Terminal top" },
];

const MAX_FILES = 8;

type FilesByLang = Record<Language, CodeFile[]>;
type ActiveByLang = Record<Language, string>;

function initialFiles(): FilesByLang {
  return Object.fromEntries(
    LANGUAGES.map((l) => [l.id, [{ name: l.file, content: STARTERS[l.id] }]]),
  ) as FilesByLang;
}
function initialActive(): ActiveByLang {
  return Object.fromEntries(LANGUAGES.map((l) => [l.id, l.file])) as ActiveByLang;
}

/** File extension for a language, e.g. "py". */
function extFor(language: Language): string {
  const f = langSpec(language).file;
  const dot = f.lastIndexOf(".");
  return dot >= 0 ? f.slice(dot + 1) : "txt";
}

export function Workbench() {
  const [language, setLanguage] = useState<Language>("python");
  const [filesByLang, setFilesByLang] = useState<FilesByLang>(initialFiles);
  const [activeByLang, setActiveByLang] = useState<ActiveByLang>(initialActive);
  const [layout, setLayout] = useState<Layout>("terminal-right");
  const [wordWrap, setWordWrap] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [pending, startTransition] = useTransition();
  const [lastError, setLastError] = useState(false);
  const term = useRef<TerminalHandle>(null);
  const setBuild = useBuildContext((s) => s.setBuild);
  const askCopilot = useCopilotControl((s) => s.askCopilot);

  // Restore saved state after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      const l = localStorage.getItem("mob.build.layout") as Layout | null;
      if (l) setLayout(l);
      const lang = localStorage.getItem("mob.build.lang") as Language | null;
      if (lang) setLanguage(lang);
      setWordWrap(localStorage.getItem("mob.build.wrap") === "1");
      const f = localStorage.getItem("mob.build.files");
      if (f) setFilesByLang((c) => ({ ...c, ...JSON.parse(f) }));
      const a = localStorage.getItem("mob.build.active");
      if (a) setActiveByLang((c) => ({ ...c, ...JSON.parse(a) }));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mob.build.layout", layout);
      localStorage.setItem("mob.build.lang", language);
      localStorage.setItem("mob.build.wrap", wordWrap ? "1" : "0");
    } catch {}
  }, [layout, language, wordWrap]);

  const files = filesByLang[language];
  const activeName = activeByLang[language];
  const activeFile = files.find((f) => f.name === activeName) ?? files[0];
  const code = activeFile?.content ?? "";
  const meta = langSpec(language);

  function persistFiles(next: FilesByLang) {
    try {
      localStorage.setItem("mob.build.files", JSON.stringify(next));
    } catch {}
  }
  function persistActive(next: ActiveByLang) {
    try {
      localStorage.setItem("mob.build.active", JSON.stringify(next));
    } catch {}
  }

  // Keep the copilot's context in sync with the active file.
  useEffect(() => {
    setBuild({ language, code });
  }, [language, code, setBuild]);

  function setCode(v: string) {
    setFilesByLang((c) => {
      const next = {
        ...c,
        [language]: c[language].map((f) => (f.name === activeName ? { ...f, content: v } : f)),
      };
      persistFiles(next);
      return next;
    });
  }

  function switchFile(name: string) {
    setActiveByLang((c) => {
      const next = { ...c, [language]: name };
      persistActive(next);
      return next;
    });
  }

  function addFile() {
    const ext = extFor(language);
    let n = files.length + 1;
    let name = `file${n}.${ext}`;
    const taken = new Set(files.map((f) => f.name));
    while (taken.has(name)) name = `file${++n}.${ext}`;
    const nextFiles = { ...filesByLang, [language]: [...files, { name, content: "" }] };
    setFilesByLang(nextFiles);
    persistFiles(nextFiles);
    switchFile(name);
  }

  function deleteFile(name: string) {
    if (files.length <= 1) return;
    const remaining = files.filter((f) => f.name !== name);
    const nextFiles = { ...filesByLang, [language]: remaining };
    setFilesByLang(nextFiles);
    persistFiles(nextFiles);
    if (activeName === name) switchFile(remaining[0].name);
  }

  function renameFile(oldName: string, raw: string) {
    const ext = extFor(language);
    let next = raw.trim();
    if (!next.includes(".")) next = `${next}.${ext}`;
    const taken = new Set(files.filter((f) => f.name !== oldName).map((f) => f.name));
    if (taken.has(next)) return; // keep old name on collision
    const nextFiles = {
      ...filesByLang,
      [language]: files.map((f) => (f.name === oldName ? { ...f, name: next } : f)),
    };
    setFilesByLang(nextFiles);
    persistFiles(nextFiles);
    if (activeName === oldName) switchFile(next);
  }

  function run() {
    startTransition(async () => {
      let output: string;
      let ok = true;
      try {
        const res = await runFiles(language, files, activeName);
        output = res.output || "(no output)";
        ok = res.ok;
      } catch {
        output = "Could not start the runtime. Check your connection and try again.";
        ok = false;
      }
      term.current?.pushRun(langSpec(language).cmd, output);
      setBuild({ output });
      setLastError(!ok);
      if (!ok) term.current?.focus();
    });
  }

  const editorPanel = (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-2 py-1.5">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-[#c9d1d9] outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Language"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id} className="bg-[#1e1e1e]">
              {l.label}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1">
          <div className="mr-1 hidden items-center gap-0.5 rounded border border-white/10 p-0.5 md:flex">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                title={l.label}
                aria-label={l.label}
                onClick={() => setLayout(l.id)}
                className={cn(
                  "rounded p-1 text-[#8b949e] hover:text-white",
                  layout === l.id && "bg-white/10 text-white",
                )}
              >
                <l.icon className="size-3.5" />
              </button>
            ))}
          </div>
          {lastError ? (
            <button
              type="button"
              onClick={() =>
                askCopilot(
                  `Why is my ${meta.label} code erroring? Explain the error and how to fix it.`,
                )
              }
              className="flex items-center gap-1 rounded bg-primary/15 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/25"
            >
              <Sparkles className="size-3.5" /> Explain this error
            </button>
          ) : null}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPrefs((p) => !p)}
              title="Preferences"
              aria-label="Preferences"
              className="flex items-center rounded px-2 py-1 text-[#8b949e] hover:bg-white/5 hover:text-white"
            >
              <SlidersHorizontal className="size-3.5" />
            </button>
            {showPrefs ? (
              <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-md border border-white/10 bg-[#161b22] p-2 text-xs text-[#c9d1d9] shadow-xl">
                <p className="mb-1.5 font-semibold uppercase tracking-wide text-[#8b949e]">
                  Preferences
                </p>
                <label className="flex cursor-pointer items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-white/5">
                  Word wrap
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={(e) => setWordWrap(e.target.checked)}
                  />
                </label>
                <p className="mt-1 px-1.5 text-[10px] text-[#8b949e]">
                  Add files with the + tab. In Python, `import filename` pulls in another file.
                </p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => downloadText(activeFile?.name ?? meta.file, code)}
            title={`Download ${activeFile?.name ?? meta.file}`}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#8b949e] hover:bg-white/5 hover:text-white"
          >
            <Download className="size-3.5" /> Export
          </button>
          <button
            type="button"
            onClick={() => setCode("")}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#8b949e] hover:bg-white/5 hover:text-white"
          >
            <Trash2 className="size-3.5" /> Clear
          </button>
          <button
            type="button"
            onClick={run}
            disabled={pending}
            className="flex items-center gap-1.5 rounded bg-[#238636] px-3 py-1 text-xs font-medium text-white hover:bg-[#2ea043] disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {pending ? "Running" : "Run"}
          </button>
        </div>
      </div>

      <FileTabs
        files={files}
        active={activeName}
        max={MAX_FILES}
        onSwitch={switchFile}
        onAdd={addFile}
        onRename={renameFile}
        onDelete={deleteFile}
      />

      <div
        className="min-h-0 flex-1"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
        }}
      >
        <CodeEditor value={code} onChange={setCode} language={meta.monaco} wordWrap={wordWrap} />
      </div>
    </div>
  );

  const terminalPanel = (
    <div className="h-full overflow-hidden">
      <Terminal ref={term} bare fill />
    </div>
  );

  const isMobile = useIsMobile();
  // On phones the side-by-side layouts crush the editor and terminal into two
  // unusable columns (Run ends up off-screen), so always stack vertically there.
  const vertical = isMobile || layout === "terminal-bottom" || layout === "terminal-top";
  const terminalFirst = !isMobile && (layout === "terminal-left" || layout === "terminal-top");
  const handleClass = vertical
    ? "h-1.5 w-full cursor-row-resize bg-border hover:bg-primary/50 transition-colors"
    : "w-1.5 cursor-col-resize bg-border hover:bg-primary/50 transition-colors";

  const first = terminalFirst ? terminalPanel : editorPanel;
  const second = terminalFirst ? editorPanel : terminalPanel;

  return (
    <PanelGroup
      key={vertical ? "v" : "h"}
      direction={vertical ? "vertical" : "horizontal"}
      autoSaveId={isMobile ? "mob-build-stacked" : `mob-build-${layout}`}
      className="min-h-0 flex-1 overflow-hidden rounded-lg border"
    >
      <Panel defaultSize={terminalFirst ? 45 : 55} minSize={20}>
        {first}
      </Panel>
      <PanelResizeHandle className={handleClass} />
      <Panel defaultSize={terminalFirst ? 55 : 45} minSize={20}>
        {second}
      </Panel>
    </PanelGroup>
  );
}
