"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Settings2, Send, Loader2, Square } from "lucide-react";
import {
  streamChat,
  webgpuAvailable,
  WEBLLM_MODELS,
  DEFAULT_WEBLLM_MODEL,
  type ChatMsg,
  type ModelSource,
} from "@/lib/ai/engine";
import { buildSystemPrompt } from "@/lib/ai/grounding";
import { useBuildContext, useCopilotControl } from "@/lib/ai/store";
import { PostBody } from "@/components/mdx/post-body";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function pageName(path: string): string {
  if (path.startsWith("/build")) return "Build";
  if (path.startsWith("/learn/")) return "a lesson";
  if (path.startsWith("/learn")) return "Learn";
  if (path.startsWith("/community")) return "Community";
  if (path.startsWith("/machines")) return "Machines";
  if (path.startsWith("/glossary")) return "Glossary";
  if (path.startsWith("/writeups")) return "Write-ups";
  if (path.startsWith("/dashboard")) return "the dashboard";
  return "the platform";
}

export function Copilot() {
  const pathname = usePathname();
  const build = useBuildContext();

  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [load, setLoad] = useState<{ text: string; progress: number } | null>(null);

  const [source, setSource] = useState<"webllm" | "byok">("webllm");
  const [model, setModel] = useState(DEFAULT_WEBLLM_MODEL);
  const [byok, setByok] = useState({ baseUrl: "https://openrouter.ai/api/v1", key: "", model: "" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const abort = useRef(false);

  useEffect(() => {
    try {
      setSource((localStorage.getItem("mob.ai.source") as "webllm" | "byok") || "webllm");
      setModel(localStorage.getItem("mob.ai.model") || DEFAULT_WEBLLM_MODEL);
      setByok({
        baseUrl: localStorage.getItem("mob.ai.byokBase") || "https://openrouter.ai/api/v1",
        key: localStorage.getItem("mob.ai.byokKey") || "",
        model: localStorage.getItem("mob.ai.byokModel") || "",
      });
    } catch {}
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, load]);

  // Another part of the app (e.g. the Build tab) can queue a question.
  const queued = useCopilotControl((s) => s.ask);
  const consumeQueued = useCopilotControl((s) => s.consume);
  useEffect(() => {
    if (!queued) return;
    setOpen(true);
    setShowSettings(false);
    consumeQueued();
    send(queued);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queued]);

  function saveSettings() {
    try {
      localStorage.setItem("mob.ai.source", source);
      localStorage.setItem("mob.ai.model", model);
      localStorage.setItem("mob.ai.byokBase", byok.baseUrl);
      localStorage.setItem("mob.ai.byokKey", byok.key);
      localStorage.setItem("mob.ai.byokModel", byok.model);
    } catch {}
    setShowSettings(false);
  }

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || busy) return;
    setInput("");
    abort.current = false;
    setBusy(true);

    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);

    const system = buildSystemPrompt({
      question: text,
      page: pageName(pathname),
      buildLang: pathname.startsWith("/build") ? build.language : undefined,
      buildCode: pathname.startsWith("/build") ? build.code : undefined,
      buildOutput: pathname.startsWith("/build") ? build.output : undefined,
    });
    const chat: ChatMsg[] = [
      { role: "system", content: system },
      ...history.map((m) => ({ role: m.role, content: m.content }) as ChatMsg),
    ];

    const src: ModelSource =
      source === "byok" && byok.key
        ? { kind: "byok", baseUrl: byok.baseUrl, apiKey: byok.key, model: byok.model || "openai/gpt-4o-mini" }
        : { kind: "webllm", modelId: model };

    try {
      let acc = "";
      for await (const delta of streamChat(src, chat, (p) => setLoad(p))) {
        if (abort.current) break;
        setLoad(null);
        acc += delta;
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
      if (!acc) {
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: "(no response)" };
          return next;
        });
      }
    } catch (err) {
      // Plain language first; the technical detail goes on a second line so it
      // is available without reading like a stack trace.
      const detail = err instanceof Error ? err.message : String(err);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          content: `Something went wrong while generating a reply. Try again, or check the model settings.\n\n\`${detail}\``,
        };
        return next;
      });
    } finally {
      setLoad(null);
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open the copilot"
        className={cn(
          "fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105",
          open && "scale-0",
        )}
      >
        <Sparkles className="size-5" />
      </button>

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Copilot"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={cn(
          "fixed bottom-5 right-5 z-40 flex w-[min(24rem,calc(100vw-2.5rem))] origin-bottom-right flex-col overflow-hidden rounded-xl border bg-card shadow-2xl transition-all",
          open ? "h-[min(34rem,calc(100vh-6rem))] opacity-100" : "pointer-events-none h-0 scale-90 opacity-0",
        )}
      >
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-semibold">Copilot</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {source === "byok" && byok.key ? "your key" : "free, in-browser"}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              aria-label="Copilot settings"
              className="rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Settings2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close copilot"
              className="rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {showSettings ? (
          <div className="space-y-3 overflow-auto p-3 text-sm">
            <div>
              <p className="mb-1 font-medium">Model</p>
              <RadioGroup
                value={source}
                onValueChange={(v) => setSource(v as "webllm" | "byok")}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="webllm" id="cop-src-webllm" />
                  <label htmlFor="cop-src-webllm">Free, in your browser (no key)</label>
                </div>
                {source === "webllm" ? (
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="ml-6 h-8 w-[calc(100%-1.5rem)] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBLLM_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {source === "webllm" && !webgpuAvailable() ? (
                  <p className="ml-6 text-xs text-warning">
                    This browser has no WebGPU. Use Chrome or Edge on desktop, or add a key below.
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="byok" id="cop-src-byok" />
                  <label htmlFor="cop-src-byok">Use my own API key</label>
                </div>
              </RadioGroup>
            </div>
            {source === "byok" ? (
              <div className="space-y-2">
                <Input
                  placeholder="Base URL (OpenRouter works from the browser)"
                  value={byok.baseUrl}
                  onChange={(e) => setByok({ ...byok, baseUrl: e.target.value })}
                  className="h-8 font-mono text-xs"
                />
                <Input
                  placeholder="API key (stored only in your browser)"
                  type="password"
                  value={byok.key}
                  onChange={(e) => setByok({ ...byok, key: e.target.value })}
                  className="h-8 font-mono text-xs"
                />
                <Input
                  placeholder="Model (e.g. openai/gpt-4o-mini)"
                  value={byok.model}
                  onChange={(e) => setByok({ ...byok, model: e.target.value })}
                  className="h-8 font-mono text-xs"
                />
              </div>
            ) : null}
            <Button type="button" size="sm" onClick={saveSettings} className="h-8 w-full text-xs">
              Save
            </Button>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-3">
              {messages.length === 0 ? (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>Ask me anything about your lessons or your code.</p>
                  <p className="mt-1 text-xs">
                    &ldquo;What is a port?&rdquo; &middot; &ldquo;Why is my code erroring?&rdquo;
                  </p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-sm leading-6",
                      m.role === "user" ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                      {m.role === "user" ? "You" : "Copilot"}
                    </p>
                    {m.role === "assistant" ? (
                      <PostBody body={m.content || "..."} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                  </div>
                ))
              )}
              {load ? (
                <div className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" /> Loading model (one time)
                  </p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.round((load.progress || 0) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t p-2">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Ask the copilot..."
                  className="max-h-28 min-h-[2.25rem] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={() => (abort.current = true)}
                    aria-label="Stop"
                    className="flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground"
                  >
                    <Square className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => send()}
                    aria-label="Send"
                    className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
