"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Monaco is heavy and browser-only, so it loads client-side on demand. The
// editor assets come from a CDN via the Monaco loader; no build-time bundling.
const Monaco = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" /> Loading editor...
    </div>
  ),
});

export function CodeEditor({
  value,
  onChange,
  language = "python",
  wordWrap = false,
}: {
  value: string;
  onChange: (v: string) => void;
  language?: string;
  wordWrap?: boolean;
}) {
  return (
    <Monaco
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      theme="vs-dark"
      onMount={(editor) => {
        // Monaco can mount before the flex container has its final height and
        // then stay tiny. Nudge it to re-measure once the layout settles.
        [0, 60, 250].forEach((t) => setTimeout(() => editor.layout(), t));
      }}
      options={{
        fontSize: 13,
        fontFamily: "var(--font-mono), monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        lineNumbers: "on",
        renderLineHighlight: "line",
        tabSize: 4,
        automaticLayout: true,
        smoothScrolling: true,
        wordWrap: wordWrap ? "on" : "off",
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
      }}
    />
  );
}
