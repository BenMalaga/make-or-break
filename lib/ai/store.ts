import { create } from "zustand";

/**
 * A tiny shared store so the globally-mounted copilot can see what the learner
 * is doing in the Build tab (their code and the last terminal output). The
 * workbench writes to it; the copilot reads it.
 */
interface BuildContext {
  language: string;
  code: string;
  output: string;
  setBuild: (p: Partial<Pick<BuildContext, "language" | "code" | "output">>) => void;
  clear: () => void;
}

export const useBuildContext = create<BuildContext>((set) => ({
  language: "",
  code: "",
  output: "",
  setBuild: (p) => set(p),
  clear: () => set({ language: "", code: "", output: "" }),
}));

/**
 * Lets any part of the app open the copilot with a question queued (for example
 * the Build tab's "Explain this error" button). The copilot consumes `ask`.
 */
interface CopilotControl {
  ask: string | null;
  askCopilot: (question: string) => void;
  consume: () => void;
}

export const useCopilotControl = create<CopilotControl>((set) => ({
  ask: null,
  askCopilot: (question) => set({ ask: question }),
  consume: () => set({ ask: null }),
}));
