import { SURFACE_FORMS, TERM_PATTERN } from "@/lib/glossary/match";

/**
 * Auto-wraps the FIRST use of every known glossary term in a lesson with
 * <Term id="...">, so a reader can expand any word they do not know without the
 * author having to remember to mark it up.
 *
 * Rules that keep it from being noise:
 *   - First occurrence per term per document. Never the second.
 *   - Hand-written <Term> wins. A term the author already wrapped is marked used
 *     up front, so this never double-wraps or fights the author's choice of
 *     where a term is best introduced.
 *   - Skips code, inline code, headings, links, and anything already inside a
 *     <Term>. Wrapping inside those is either broken or ugly.
 *   - Longest surface form wins, so "IP address" is matched before "address".
 *
 * Matching is shared with the glossary usage index (lib/glossary/match.ts).
 * Runs at MDX compile time, so no .mdx file on disk is ever rewritten.
 */

// Node types whose subtrees must never be touched.
const SKIP_TYPES = new Set([
  "code",
  "inlineCode",
  "heading",
  "link",
  "linkReference",
  "definition",
  "yaml",
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
]);

interface Node {
  type: string;
  name?: string;
  value?: string;
  children?: Node[];
  attributes?: { type: string; name: string; value: unknown }[];
}

function termNode(id: string, text: string): Node {
  return {
    type: "mdxJsxTextElement",
    name: "Term",
    attributes: [{ type: "mdxJsxAttribute", name: "id", value: id }],
    children: [{ type: "text", value: text }],
  };
}

/** Collect ids the author already wrapped by hand, so we never re-wrap them. */
function collectManual(node: Node, used: Set<string>): void {
  if (node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement") {
    if (node.name === "Term") {
      const attr = node.attributes?.find((a) => a.name === "id");
      if (typeof attr?.value === "string") used.add(attr.value);
      return;
    }
  }
  for (const child of node.children ?? []) collectManual(child, used);
}

/** Split one text node into text + <Term> nodes. Returns null if nothing matched. */
function wrapText(value: string, used: Set<string>): Node[] | null {
  TERM_PATTERN.lastIndex = 0;
  let out: Node[] | null = null;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = TERM_PATTERN.exec(value)) !== null) {
    const id = SURFACE_FORMS.get(m[0].toLowerCase());
    if (!id || used.has(id)) continue;
    used.add(id);
    out ??= [];
    if (m.index > last) out.push({ type: "text", value: value.slice(last, m.index) });
    out.push(termNode(id, m[0]));
    last = m.index + m[0].length;
  }

  if (!out) return null;
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out;
}

function walk(node: Node, used: Set<string>): void {
  if (!node.children?.length) return;
  if (node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement") {
    if (node.name === "Term") return;
  }

  const next: Node[] = [];
  for (const child of node.children) {
    if (SKIP_TYPES.has(child.type)) {
      next.push(child);
      continue;
    }
    if (child.type === "text" && typeof child.value === "string") {
      const replaced = wrapText(child.value, used);
      next.push(...(replaced ?? [child]));
      continue;
    }
    walk(child, used);
    next.push(child);
  }
  node.children = next;
}

export function remarkGlossaryTerms() {
  return (tree: Node) => {
    const used = new Set<string>();
    collectManual(tree, used);
    walk(tree, used);
  };
}
