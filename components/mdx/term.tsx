import type { ReactNode } from "react";
import { GLOSSARY, glossaryEntry } from "@/lib/glossary";
import { TermPopover } from "./term-popover";

/**
 * An inline glossary term. Wrap the FIRST use of a term in a lesson so a newer
 * reader can expand the definition in place while an experienced reader reads
 * past it untouched. This is what lets one canonical lesson serve both, instead
 * of maintaining a separate beginner version of everything.
 *
 * MDX usage:
 *   The scanner sends a <Term id="syn">SYN</Term> and waits for a reply.
 *   Every <Term id="host" /> on the network has an address.
 *
 * Resolution happens on the server, so a lesson only ships the terms it uses.
 * An unknown id renders as plain text, so a typo costs a definition rather than
 * breaking the lesson.
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = glossaryEntry(id);
  if (!entry) return <>{children ?? id}</>;

  const related = (entry.seeAlso ?? [])
    .map((key) => GLOSSARY[key]?.term)
    .filter((t): t is string => Boolean(t));

  return (
    <TermPopover id={entry.id} term={entry.term} definition={entry.definition} related={related}>
      {children ?? entry.term}
    </TermPopover>
  );
}
