"use server";

import { hashFlag } from "@/lib/flags";
import { listMachineFiles } from "@/lib/content/mdx";

export type SubmitFlagResult =
  | { result: "CORRECT"; flagLabel: string; points: number; kind: "USER" | "ROOT" }
  | { result: "INCORRECT" }
  | { result: "DUPLICATE"; flagLabel: string };

/**
 * Validate a flag submission against the machine's MDX frontmatter. The hash
 * comparison happens here so plaintext flag values never reach the client.
 * Nothing is recorded or rate-limited server-side: the browser's progress
 * store owns flags, points, and attempts, so the client passes its
 * already-captured labels to detect duplicates.
 */
export async function submitFlag(
  machineSlug: string,
  rawFlag: string,
  ownedLabels: string[] = [],
): Promise<SubmitFlagResult> {
  const machine = listMachineFiles().find((m) => m.slug === machineSlug);
  if (!machine) return { result: "INCORRECT" };

  const submitted = hashFlag(rawFlag);
  const matched = machine.frontmatter.flags.find((f) => hashFlag(f.value) === submitted);
  if (!matched) return { result: "INCORRECT" };
  if (ownedLabels.includes(matched.label)) {
    return { result: "DUPLICATE", flagLabel: matched.label };
  }
  return {
    result: "CORRECT",
    flagLabel: matched.label,
    points: matched.points ?? 0,
    kind: matched.type,
  };
}

/**
 * Return the body of a machine hint, keyed by its frontmatter index. The
 * client checks the point cost and deducts it in its own store BEFORE calling
 * this; the server only hands back the text.
 */
export async function unlockHint(
  machineSlug: string,
  hintKey: string,
): Promise<string | null> {
  const machine = listMachineFiles().find((m) => m.slug === machineSlug);
  const hints = machine?.frontmatter.hints ?? [];
  const idx = Number(hintKey);
  if (!Number.isInteger(idx) || idx < 0 || idx >= hints.length) return null;
  return hints[idx].body;
}
