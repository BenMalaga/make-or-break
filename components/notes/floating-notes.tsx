"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { NotebookPen, X, Check, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { useLessonInteractive } from "@/lib/content/lesson-context";
import { cn } from "@/lib/utils";

const MIN_W = 260;
const MIN_H = 220;
const DEF = { w: 340, h: 420 };

/**
 * Notes that follow you while you read a lesson. A small square button hovers in
 * the top-right (mirroring the copilot bottom-right); clicking it opens a window
 * that can be dragged anywhere and resized. It reads and writes the same
 * per-lesson notes context (LessonProgress.notes) and auto-saves. Rendered
 * through a portal to document.body so its fixed position is relative to the
 * viewport, not the page's transformed fade wrapper.
 */
export function FloatingNotes() {
  const ctx = useLessonInteractive();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState(DEF);

  const posRef = useRef(pos);
  const sizeRef = useRef(size);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    setMounted(true);
    try {
      setOpen(localStorage.getItem("mob.notes.open") === "1");
      const p = localStorage.getItem("mob.notes.pos");
      if (p) setPos(JSON.parse(p));
      const s = localStorage.getItem("mob.notes.size");
      if (s) setSize(JSON.parse(s));
    } catch {}
  }, []);

  function setOpenPersisted(v: boolean) {
    setOpen(v);
    try {
      localStorage.setItem("mob.notes.open", v ? "1" : "0");
    } catch {}
  }

  const defaultPos = useCallback(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    return { x: Math.max(8, vw - sizeRef.current.w - 16), y: 72 };
  }, []);

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    const cur = posRef.current ?? defaultPos();
    const sx = e.clientX;
    const sy = e.clientY;
    const move = (ev: PointerEvent) => {
      const w = sizeRef.current.w;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const x = Math.max(0, Math.min(cur.x + (ev.clientX - sx), vw - Math.min(w, vw)));
      const y = Math.max(56, Math.min(cur.y + (ev.clientY - sy), vh - 48));
      const next = { x, y };
      posRef.current = next;
      setPos(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      try {
        if (posRef.current) localStorage.setItem("mob.notes.pos", JSON.stringify(posRef.current));
      } catch {}
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const ow = sizeRef.current.w;
    const oh = sizeRef.current.h;
    const move = (ev: PointerEvent) => {
      const w = Math.max(MIN_W, Math.min(ow + (ev.clientX - sx), window.innerWidth - 24));
      const h = Math.max(MIN_H, Math.min(oh + (ev.clientY - sy), window.innerHeight - 72));
      const next = { w, h };
      sizeRef.current = next;
      setSize(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      try {
        localStorage.setItem("mob.notes.size", JSON.stringify(sizeRef.current));
      } catch {}
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  if (!ctx || !mounted) return null;

  const hasNotes = ctx.notes.trim().length > 0;
  const p = pos ?? defaultPos();

  const ui = open ? (
    <div
      className="fixed z-40 flex flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
      style={{ left: p.x, top: p.y, width: size.w, height: size.h }}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-grab touch-none select-none items-center gap-2 border-b bg-muted/30 px-3 py-2 active:cursor-grabbing"
      >
        <NotebookPen className="size-4 text-primary" />
        <span className="text-sm font-semibold">My notes</span>
        <span
          className={cn(
            "ml-auto flex items-center gap-1 text-xs",
            ctx.notesError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {ctx.notesSaving ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving
            </>
          ) : ctx.notesError ? (
            <>
              <AlertTriangle className="size-3" /> Not saved
            </>
          ) : hasNotes ? (
            <>
              <Check className="size-3 text-success" /> Saved
            </>
          ) : null}
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setOpenPersisted(false)}
          title="Close notes"
          className="rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <textarea
        value={ctx.notes}
        onChange={(e) => ctx.updateNotes(e.target.value)}
        placeholder="Jot down commands that worked, gotchas, questions to revisit..."
        className="scrollbar-thin flex-1 resize-none bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />

      <div className="flex items-center justify-between border-t px-3 py-1.5">
        <Link
          href="/notes"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="size-3.5" /> All my notes
        </Link>
      </div>

      {/* Resize handle */}
      <span
        onPointerDown={startResize}
        title="Drag to resize"
        className="absolute bottom-0 right-0 flex size-4 cursor-nwse-resize items-end justify-end p-0.5"
      >
        <svg viewBox="0 0 10 10" className="size-2.5 text-muted-foreground/50" fill="currentColor">
          <path d="M9 1v8H1z" opacity="0.6" />
        </svg>
      </span>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setOpenPersisted(true)}
      title="Notes"
      className={cn(
        "fixed right-4 top-16 z-40 flex size-10 items-center justify-center rounded-lg border bg-card shadow-md transition-colors hover:bg-accent/50",
        hasNotes ? "text-primary" : "text-muted-foreground",
      )}
    >
      <NotebookPen className="size-5" />
      {hasNotes ? (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
      ) : null}
    </button>
  );

  return createPortal(ui, document.body);
}
