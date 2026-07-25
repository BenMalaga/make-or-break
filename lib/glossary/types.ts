/**
 * Shared types for the glossary.
 *
 * The glossary is split into one module per category (networking.ts, systems.ts,
 * ...) and merged in index.ts. Two reasons: several people or agents can extend
 * different categories without touching the same file, and the category label is
 * attached at merge time so individual entries stay terse.
 */
export interface GlossaryEntry {
  /** Display name, used when <Term> has no children. */
  term: string;
  /**
   * Two or three sentences, maximum. This is a reminder, not a lesson.
   * Self-contained: never define a term using another term the reader would also
   * have to look up, unless that one is linked via seeAlso.
   */
  definition: string;
  /** Ids of related entries, surfaced in the popover and on the glossary page. */
  seeAlso?: string[];
  /**
   * Skip this term when auto-wrapping first uses in lessons. Set it on terms
   * whose surface word is common English with a domain-specific meaning here
   * ("image", "key", "process"), where auto-wrapping the generic word to this
   * definition would mislead. The term stays in the glossary and can still be
   * wrapped by hand with <Term id="...">.
   */
  noAutoWrap?: boolean;
}

/** An entry once merged, with its category attached and its id inlined. */
export interface ResolvedEntry extends GlossaryEntry {
  id: string;
  category: string;
  categoryLabel: string;
}

/** A category module: kebab-case id -> entry. */
export type GlossaryModule = Record<string, GlossaryEntry>;
