import type { MDXComponents } from "mdx/types";
import { CommandCard } from "./command-card";
import { CommandBlock } from "./command-block";
import { ExpectedOutput } from "./expected-output";
import { Callout } from "./callout";
import { Quiz } from "./quiz";
import { Exercise } from "./exercise";
import { LessonNotes } from "./lesson-notes";
import { Diagram } from "./diagram";
import { Term } from "./term";
import { Terminal } from "./terminal";
import { SqlInjectionLab } from "./sql-injection-lab";
import { XssLab } from "./xss-lab";
import { CommandInjectionLab } from "./command-injection-lab";

/**
 * The component map handed to MDXRemote. Anything here is usable by tag name in
 * any .mdx lesson/machine file without an import. Also styles base HTML elements
 * so raw markdown (headings, code, tables, links) matches the design system.
 */
export const mdxComponents: MDXComponents = {
  // Interactive primitives
  CommandCard,
  CommandBlock,
  ExpectedOutput,
  Callout,
  Quiz,
  Exercise,
  Notes: LessonNotes,
  Diagram,
  Term,
  Terminal,
  SqlInjectionLab,
  XssLab,
  CommandInjectionLab,

  // Base HTML element styling
  h1: (p) => <h1 className="mt-8 scroll-m-20 text-3xl font-bold tracking-tight first:mt-0" {...p} />,
  h2: (p) => <h2 className="mt-8 scroll-m-20 border-b pb-1.5 text-2xl font-semibold tracking-tight first:mt-0" {...p} />,
  h3: (p) => <h3 className="mt-6 scroll-m-20 text-xl font-semibold tracking-tight" {...p} />,
  h4: (p) => <h4 className="mt-4 scroll-m-20 text-lg font-semibold tracking-tight" {...p} />,
  p: (p) => <p className="leading-7 [&:not(:first-child)]:mt-4" {...p} />,
  ul: (p) => <ul className="my-4 ml-6 list-disc [&>li]:mt-1.5" {...p} />,
  ol: (p) => <ol className="my-4 ml-6 list-decimal [&>li]:mt-1.5" {...p} />,
  a: (p) => <a className="font-medium text-primary underline underline-offset-4" {...p} />,
  blockquote: (p) => <blockquote className="mt-4 border-l-2 border-primary/50 pl-4 italic text-muted-foreground" {...p} />,
  hr: (p) => <hr className="my-8 border-border" {...p} />,
  table: (p) => (
    <div className="my-6 w-full overflow-x-auto scrollbar-thin">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  th: (p) => <th className="border-b px-3 py-2 text-left font-semibold" {...p} />,
  td: (p) => <td className="border-b border-border/60 px-3 py-2" {...p} />,
  code: (p) => (
    <code
      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
      {...p}
    />
  ),
  pre: (p) => (
    <pre
      className="scrollbar-thin my-4 overflow-x-auto rounded-lg border bg-card p-4 font-mono text-sm [&_code]:bg-transparent [&_code]:p-0"
      {...p}
    />
  ),
};
