import type { ReactNode } from "react";
import { CodeBlock } from "./code-block";

/**
 * Renders a post body as markdown-lite: fenced code blocks (```lang ... ```),
 * headings, lists, blockquotes, and inline bold/italic/code/links. It builds
 * React elements from parsed text and never injects HTML, so user content
 * cannot smuggle markup. Links are restricted to http(s) and relative URLs.
 */
export function PostBody({ body }: { body: string }) {
  const segments: ReactNode[] = [];
  const fence = /```([\w+#.-]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = fence.exec(body)) !== null) {
    if (m.index > last) segments.push(<Prose key={key++} text={body.slice(last, m.index)} />);
    segments.push(<CodeBlock key={key++} code={m[2].replace(/\n$/, "")} lang={m[1] || undefined} />);
    last = m.index + m[0].length;
  }
  if (last < body.length) segments.push(<Prose key={key++} text={body.slice(last)} />);

  return <div className="space-y-3 text-sm leading-6">{segments}</div>;
}

/** Render a run of non-code text into paragraphs, headings, lists, quotes. */
function Prose({ text }: { text: string }) {
  const trimmed = text.replace(/^\n+|\n+$/g, "");
  if (!trimmed) return null;
  const lines = trimmed.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const lvl = heading[1].length;
      const cls =
        lvl === 1 ? "text-lg font-bold" : lvl === 2 ? "text-base font-bold" : "text-sm font-semibold";
      blocks.push(
        <p key={key++} className={cls}>
          {renderInline(heading[2])}
        </p>,
      );
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        q.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground"
        >
          {renderInline(q.join(" "))}
        </blockquote>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="ml-5 list-disc space-y-1">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,3})\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="whitespace-pre-wrap break-words">
        {renderInline(para.join("\n"))}
      </p>,
    );
  }

  return <>{blocks}</>;
}

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)]+\))/g;

/** Inline formatting: `code`, **bold**, *italic*, [text](url). */
function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.length > 3 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length > 1 && /^\*[^*]+\*$/.test(part)) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2].trim();
      // Allow only absolute http(s) or a true single-slash relative path. A
      // protocol-relative URL (//evil.com) also starts with "/" but resolves
      // off-site in the same tab, so reject it as a phishing vector.
      const safe = /^(https?:\/\/|\/(?!\/))/i.test(href);
      if (safe) {
        return (
          <a
            key={i}
            href={href}
            target={href.startsWith("/") ? undefined : "_blank"}
            rel="noopener noreferrer nofollow"
            className="font-medium text-primary underline underline-offset-2"
          >
            {link[1]}
          </a>
        );
      }
      return <span key={i}>{link[1]}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}
