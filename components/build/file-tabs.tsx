"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Editor file tabs: switch, add, double-click to rename, x to delete. */
export function FileTabs({
  files,
  active,
  max,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
}: {
  files: { name: string }[];
  active: string;
  max: number;
  onSwitch: (name: string) => void;
  onAdd: () => void;
  onRename: (name: string, next: string) => void;
  onDelete: (name: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function commit(original: string) {
    const next = draft.trim();
    if (next && next !== original) onRename(original, next);
    setEditing(null);
  }

  return (
    <div className="scrollbar-thin flex items-center gap-0.5 overflow-x-auto border-b border-white/10 bg-[#181818] px-1.5">
      {files.map((f) => {
        const on = f.name === active;
        const startRename = () => {
          setEditing(f.name);
          setDraft(f.name);
        };
        return (
          <div
            key={f.name}
            className={cn(
              "group flex shrink-0 items-center gap-1.5 rounded-t px-2.5 py-1.5 font-mono text-[11px]",
              on ? "bg-[#1e1e1e] text-white" : "text-[#8b949e] hover:text-white",
            )}
          >
            {editing === f.name ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commit(f.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit(f.name);
                  else if (e.key === "Escape") setEditing(null);
                }}
                className="w-24 border-b border-white/30 bg-transparent font-mono text-white outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => onSwitch(f.name)}
                onDoubleClick={startRename}
                onKeyDown={(e) => {
                  if (e.key === "F2") {
                    e.preventDefault();
                    startRename();
                  }
                }}
                title="Switch file. Double-click or F2 to rename."
                className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                {f.name}
              </button>
            )}
            {files.length > 1 ? (
              <button
                type="button"
                onClick={() => onDelete(f.name)}
                title="Delete file"
                aria-label={`Delete ${f.name}`}
                className={cn(
                  "rounded-sm text-[#8b949e] outline-none hover:text-red-400 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/50",
                  // Always visible on the active tab so touch users (no hover)
                  // can delete; other tabs reveal it on hover/focus.
                  on ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
        );
      })}
      {files.length < max ? (
        <button
          type="button"
          onClick={onAdd}
          title="New file"
          className="ml-1 shrink-0 rounded p-1 text-[#8b949e] hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
