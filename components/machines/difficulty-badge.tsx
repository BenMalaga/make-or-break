import type { Difficulty } from "@prisma/client";
import { cn } from "@/lib/utils";
import { DIFFICULTY_META } from "@/lib/constants";

// Literal class strings so Tailwind's JIT includes them.
const STYLES: Record<Difficulty, string> = {
  EASY: "bg-easy/15 text-easy",
  MEDIUM: "bg-medium/15 text-medium",
  HARD: "bg-hard/15 text-hard",
  INSANE: "bg-insane/15 text-insane",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[difficulty],
        className,
      )}
    >
      {DIFFICULTY_META[difficulty].label}
    </span>
  );
}
