import type { GlossaryModule, ResolvedEntry } from "./types";
import { NETWORKING } from "./networking";
import { SYSTEMS } from "./systems";
import { OFFENSIVE } from "./offensive";
import { WEB } from "./web";
import { WINDOWS } from "./windows";
import { CRYPTO } from "./crypto";
import { DEFENSE } from "./defense";
import { CLOUD } from "./cloud";
import { IDENTITY } from "./identity";
import { MALWARE } from "./malware";
import { GRC } from "./grc";

export type { GlossaryEntry, ResolvedEntry } from "./types";

/**
 * The glossary: every term the platform is allowed to assume, in one place.
 *
 * It backs two things. The <Term> component, which lets the first use of a term
 * inside a lesson expand into its definition in place, so one canonical lesson
 * serves a beginner and a practitioner without maintaining separate versions.
 * And the /glossary page, which is the searchable index of the whole vocabulary.
 *
 * To add terms: edit the category module, or add a new one and register it here.
 * Categories are separate files so parallel work does not collide.
 */
export const CATEGORIES: { slug: string; label: string; module: GlossaryModule }[] = [
  { slug: "networking", label: "Networking", module: NETWORKING },
  { slug: "systems", label: "Systems and Linux", module: SYSTEMS },
  { slug: "web", label: "Web and HTTP", module: WEB },
  { slug: "windows", label: "Windows and Active Directory", module: WINDOWS },
  { slug: "offensive", label: "Offensive Security", module: OFFENSIVE },
  { slug: "defense", label: "Blue Team and Defense", module: DEFENSE },
  { slug: "malware", label: "Malware and Reverse Engineering", module: MALWARE },
  { slug: "crypto", label: "Cryptography", module: CRYPTO },
  { slug: "cloud", label: "Cloud and Containers", module: CLOUD },
  { slug: "identity", label: "Identity and Access", module: IDENTITY },
  { slug: "grc", label: "Governance and Risk", module: GRC },
];

function buildIndex(): Record<string, ResolvedEntry> {
  const out: Record<string, ResolvedEntry> = {};
  for (const { slug, label, module } of CATEGORIES) {
    for (const [id, entry] of Object.entries(module)) {
      // First registration wins, so a duplicate id in a later category cannot
      // silently redefine an existing term.
      if (out[id]) continue;
      out[id] = { ...entry, id, category: slug, categoryLabel: label };
    }
  }
  return out;
}

export const GLOSSARY: Record<string, ResolvedEntry> = buildIndex();

/** Every entry, sorted alphabetically by display term. */
export const ALL_TERMS: ResolvedEntry[] = Object.values(GLOSSARY).sort((a, b) =>
  a.term.localeCompare(b.term, "en", { sensitivity: "base" }),
);

/** Look up an entry. Returns null for unknown ids so a typo degrades gracefully. */
export function glossaryEntry(id: string): ResolvedEntry | null {
  return GLOSSARY[id] ?? null;
}

/** Ids that other entries reference via seeAlso but that do not exist. */
export function danglingReferences(): { from: string; missing: string }[] {
  const bad: { from: string; missing: string }[] = [];
  for (const entry of Object.values(GLOSSARY)) {
    for (const ref of entry.seeAlso ?? []) {
      if (!GLOSSARY[ref]) bad.push({ from: entry.id, missing: ref });
    }
  }
  return bad;
}
