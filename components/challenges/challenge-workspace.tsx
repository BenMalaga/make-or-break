"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  ArrowLeft,
  Play,
  Loader2,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  Lightbulb,
  Send,
  Trophy,
  XCircle,
  AlertTriangle,
  FileText,
  MessagesSquare,
} from "lucide-react";
import { runCode, LANGUAGES, STARTERS, langSpec, type Language } from "@/lib/build/run";
import type { ChallengeCommentDTO } from "@/lib/actions/challenges";
import { downloadText } from "@/lib/download";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { VoteButton } from "@/components/challenges/vote-button";
import { ChallengeDiscussion } from "@/components/challenges/challenge-discussion";
import { CodeEditor } from "@/components/build/code-editor";
import { Terminal, type TerminalHandle } from "@/components/mdx/terminal";
import { LucideIcon } from "@/components/lucide-icon";
import {
  type ChallengeMeta,
  DIFFICULTY_CLASS,
  DIFFICULTY_LABEL,
  categoryMeta,
  answerPlaceholder,
} from "@/lib/challenges/config";
import { cn } from "@/lib/utils";

type SolveState = "idle" | "wrong" | "solved";

export function ChallengeWorkspace({
  challenge,
  description,
  initialSolved,
  initialVoted = false,
  comments = [],
}: {
  challenge: ChallengeMeta;
  description: React.ReactNode;
  initialSolved: boolean;
  initialVoted?: boolean;
  comments?: ChallengeCommentDTO[];
}) {
  const [panelTab, setPanelTab] = useState<"problem" | "discussion">("problem");
  const isMobile = useIsMobile();
  const startLang = (LANGUAGES.find((l) => l.id === challenge.starterLang)?.id ??
    "python") as Language;

  const [language, setLanguage] = useState<Language>(startLang);
  const [codeByLang, setCodeByLang] = useState<Record<Language, string>>(() => {
    const base = { ...STARTERS };
    if (challenge.starter && challenge.starterLang && base[challenge.starterLang as Language] !== undefined) {
      base[challenge.starterLang as Language] = challenge.starter;
    }
    return base;
  });
  const [pending, startRun] = useTransition();
  const term = useRef<TerminalHandle>(null);

  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<SolveState>(initialSolved ? "solved" : "idle");
  const [checking, setChecking] = useState(false);
  const [awarded, setAwarded] = useState(0);
  const [revealed, setRevealed] = useState(0);
  // A failed submit (network error, 4xx/5xx) is distinct from a wrong answer:
  // never tell the user they were wrong when the server never judged them.
  const [submitError, setSubmitError] = useState<string | null>(null);

  const storageKey = `mob.chal.${challenge.slug}`;

  // Restore saved code after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setCodeByLang((c) => ({ ...c, ...JSON.parse(saved) }));
      const savedLang = localStorage.getItem(`${storageKey}.lang`) as Language | null;
      if (savedLang && LANGUAGES.some((l) => l.id === savedLang)) setLanguage(savedLang);
    } catch {
      // ignore corrupt storage
    }
  }, [storageKey]);

  const code = codeByLang[language];
  const meta = langSpec(language);

  function setCode(v: string) {
    setCodeByLang((c) => {
      const next = { ...c, [language]: v };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function changeLanguage(l: Language) {
    setLanguage(l);
    try {
      localStorage.setItem(`${storageKey}.lang`, l);
    } catch {}
  }

  function run() {
    startRun(async () => {
      let output: string;
      try {
        const res = await runCode(language, code);
        output = res.output || "(no output)";
      } catch {
        output = "Could not start the runtime. Check your connection and try again.";
      }
      term.current?.pushRun(langSpec(language).cmd, output);
    });
  }

  function resetCode() {
    const starter =
      challenge.starter && language === challenge.starterLang
        ? challenge.starter
        : STARTERS[language];
    setCode(starter);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || checking) return;
    setChecking(true);
    setSubmitError(null);
    try {
      const r = await fetch(`/api/challenges/${challenge.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!r.ok) {
        setSubmitError("Could not check your answer just now. Check your connection and try again.");
        return;
      }
      const d = await r.json();
      if (d.correct || d.solved) {
        setState("solved");
        setAwarded(d.pointsAwarded ?? 0);
      } else {
        setState("wrong");
      }
    } catch {
      setSubmitError("Could not reach the server. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  const cat = categoryMeta(challenge.category);

  const descriptionPanel = (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Link
          href={`/learn?view=challenges&track=${challenge.track}`}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Challenges
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {challenge.community ? (
            <VoteButton
              slug={challenge.slug}
              initialUpvotes={challenge.upvotes ?? 0}
              initialVoted={initialVoted}
            />
          ) : null}
          {state === "solved" ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <CheckCircle2 className="size-3.5" /> Solved
            </span>
          ) : null}
        </div>
      </div>

      {/* Problem / Discussion tabs */}
      <div className="flex items-center gap-1 border-b px-2 py-1">
        {(["problem", "discussion"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setPanelTab(t)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              panelTab === t
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "problem" ? (
              <FileText className="size-3.5" />
            ) : (
              <MessagesSquare className="size-3.5" />
            )}
            {t}
            {t === "discussion" && comments.length ? ` (${comments.length})` : ""}
          </button>
        ))}
      </div>

      {panelTab === "discussion" ? (
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <ChallengeDiscussion slug={challenge.slug} initialComments={comments} />
        </div>
      ) : (
      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              DIFFICULTY_CLASS[challenge.difficulty],
            )}
          >
            {DIFFICULTY_LABEL[challenge.difficulty]}
          </span>
          <span className="flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <LucideIcon name={cat.icon} className="size-3" /> {cat.label}
          </span>
          <span className="flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Trophy className="size-3" /> {challenge.points} pts
          </span>
          {challenge.community ? (
            <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              by {challenge.author ?? "community"}
            </span>
          ) : null}
        </div>

        <h1 className="text-xl font-bold tracking-tight">{challenge.title}</h1>

        <div className="mdx-content mt-3 text-sm leading-7">{description}</div>

        {challenge.hints.length ? (
          <div className="mt-6 space-y-2">
            {challenge.hints.slice(0, revealed).map((h, i) => (
              <div
                key={i}
                className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground"
              >
                <span className="font-semibold text-foreground">Hint {i + 1}. </span>
                {h}
              </div>
            ))}
            {revealed < challenge.hints.length ? (
              <button
                type="button"
                onClick={() => setRevealed((n) => n + 1)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Lightbulb className="size-3.5" /> Show a hint ({revealed}/
                {challenge.hints.length})
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      )}

      {/* Pinned answer submission */}
      <div className="border-t bg-muted/20 p-3">
        {state === "solved" ? (
          <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            <span className="font-medium">
              Solved{awarded ? ` (+${awarded} pts)` : ""}. Nice work.
            </span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            <label htmlFor="challenge-answer" className="text-xs font-medium text-muted-foreground">
              Your answer
            </label>
            <div className="flex gap-2">
              <input
                id="challenge-answer"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (state === "wrong") setState("idle");
                  if (submitError) setSubmitError(null);
                }}
                placeholder={answerPlaceholder(challenge.answerType)}
                autoComplete="off"
                spellCheck={false}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={checking || !answer.trim()}
                className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {checking ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Submit
              </button>
            </div>
            {state === "wrong" ? (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <XCircle className="size-3.5" /> Not quite. Use the editor to work it out, then try
                again.
              </p>
            ) : null}
            {submitError ? (
              <p className="flex items-center gap-1.5 text-xs text-warning">
                <AlertTriangle className="size-3.5" /> {submitError}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );

  const editorPanel = (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-2 py-1.5">
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value as Language)}
          className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-[#c9d1d9] outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Language"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id} className="bg-[#1e1e1e]">
              {l.label}
            </option>
          ))}
        </select>
        <span className="font-mono text-[11px] text-[#8b949e]">{meta.file}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={resetCode}
            title="Reset to starter code"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#8b949e] hover:bg-white/5 hover:text-white"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={() => downloadText(meta.file, code)}
            title={`Download ${meta.file}`}
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
      <div
        className="min-h-0 flex-1"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
        }}
      >
        <CodeEditor value={code} onChange={setCode} language={meta.monaco} />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelGroup
        key={isMobile ? "stacked" : "side-by-side"}
        direction={isMobile ? "vertical" : "horizontal"}
        autoSaveId={isMobile ? "mob-challenge-v" : "mob-challenge"}
        className="min-h-0 flex-1 overflow-hidden rounded-lg border"
      >
        <Panel defaultSize={42} minSize={25}>
          {descriptionPanel}
        </Panel>
        <PanelResizeHandle
          className={cn(
            "bg-border transition-colors hover:bg-primary/50",
            isMobile ? "h-1.5 w-full cursor-row-resize" : "w-1.5 cursor-col-resize",
          )}
        />
        <Panel defaultSize={58} minSize={30}>
          <PanelGroup direction="vertical" className="h-full">
            <Panel defaultSize={62} minSize={20}>
              {editorPanel}
            </Panel>
            <PanelResizeHandle className="h-1.5 w-full cursor-row-resize bg-border transition-colors hover:bg-primary/50" />
            <Panel defaultSize={38} minSize={15}>
              <div className="h-full overflow-hidden">
                <Terminal ref={term} bare fill />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
