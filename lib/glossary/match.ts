import { GLOSSARY } from "./index";

/**
 * Surface-form matching for glossary terms, shared by the auto-wrap remark
 * plugin and the "which lessons use this term" index so both agree on what
 * counts as a mention.
 */

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** lowercase surface form -> glossary id, including a naive plural. */
function buildSurfaceForms(): Map<string, string> {
  const forms = new Map<string, string>();
  for (const [id, entry] of Object.entries(GLOSSARY)) {
    // Terms flagged noAutoWrap are still real glossary entries, they just do not
    // participate in surface-form matching, so a common word like "image" is not
    // auto-linked to a domain-specific definition.
    if (entry.noAutoWrap) continue;
    const term = entry.term;
    const add = (s: string) => {
      const key = s.toLowerCase();
      if (!forms.has(key)) forms.set(key, id);
    };
    add(term);
    // "packet" -> "packets", but not acronyms (DNS) or words already sibilant.
    if (!/[sxz]$/i.test(term) && !/^[A-Z0-9-]+$/.test(term)) add(`${term}s`);
  }
  return forms;
}

export const SURFACE_FORMS = buildSurfaceForms();

/** One alternation, longest surface first, so "IP address" beats "address". */
export const TERM_PATTERN = new RegExp(
  `\\b(${[...SURFACE_FORMS.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|")})\\b`,
  "gi",
);

/** Every distinct glossary id mentioned anywhere in a block of text. */
export function findTermIds(text: string): Set<string> {
  const ids = new Set<string>();
  for (const m of text.matchAll(TERM_PATTERN)) {
    const id = SURFACE_FORMS.get(m[0].toLowerCase());
    if (id) ids.add(id);
  }
  return ids;
}
