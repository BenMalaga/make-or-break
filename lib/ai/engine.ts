/**
 * The copilot's chat engine. Two backends behind one streaming interface:
 *
 *  - WebLLM (default): an open model (Llama 3.2) compiled to run in the browser
 *    on WebGPU. Free, no key, private. Downloads the model once, then caches it.
 *  - Bring your own key: any OpenAI-compatible endpoint (OpenRouter, Groq, and
 *    others that allow browser calls), for people who want a bigger model.
 *
 * The web-llm package is large, so it is imported lazily the first time a model
 * is actually loaded.
 */

export interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export type ModelSource =
  | { kind: "webllm"; modelId: string }
  | { kind: "byok"; baseUrl: string; apiKey: string; model: string };

export interface LoadProgress {
  text: string;
  progress: number;
}

export const WEBLLM_MODELS = [
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B (fast, ~0.9 GB)" },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B (smarter, ~2 GB)" },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", label: "Phi 3.5 mini (~2.3 GB)" },
];
export const DEFAULT_WEBLLM_MODEL = WEBLLM_MODELS[0].id;

export function webgpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

// One engine, reused across messages; rebuilt only if the model changes.
type Engine = { chat: { completions: { create: (o: unknown) => Promise<AsyncIterable<unknown>> } } };
let engine: Engine | null = null;
let loadedModel: string | null = null;

async function ensureWebLLM(modelId: string, onProgress: (p: LoadProgress) => void): Promise<Engine> {
  if (!webgpuAvailable()) {
    throw new Error(
      "This browser has no WebGPU, which the free in-browser model needs. Use Chrome or Edge on desktop, or add your own API key in settings.",
    );
  }
  if (engine && loadedModel === modelId) return engine;
  const webllm = await import("@mlc-ai/web-llm");
  engine = (await webllm.CreateMLCEngine(modelId, {
    initProgressCallback: (r: { text: string; progress: number }) =>
      onProgress({ text: r.text, progress: r.progress }),
  })) as unknown as Engine;
  loadedModel = modelId;
  return engine;
}

/** Stream a completion, yielding text deltas. */
export async function* streamChat(
  source: ModelSource,
  messages: ChatMsg[],
  onProgress: (p: LoadProgress) => void,
): AsyncGenerator<string> {
  if (source.kind === "webllm") {
    const eng = await ensureWebLLM(source.modelId, onProgress);
    const chunks = await eng.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.6,
      max_tokens: 800,
    });
    for await (const chunk of chunks as AsyncIterable<{ choices: { delta: { content?: string } }[] }>) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
    return;
  }

  // OpenAI-compatible streaming over SSE.
  const res = await fetch(`${source.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${source.apiKey}` },
    body: JSON.stringify({ model: source.model, messages, stream: true, temperature: 0.6 }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`API error ${res.status}. Check your key, model, and endpoint.`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore keep-alive / partial lines
      }
    }
  }
}
