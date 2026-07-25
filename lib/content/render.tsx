import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/mdx";
import { remarkGlossaryTerms } from "./remark-glossary-terms";

/**
 * Server component that compiles + renders an MDX body string with the shared
 * interactive component map. Used by lesson pages and machine pages.
 *
 * MDXRemote (rsc) is itself an async server component, so this must be rendered
 * inside a server component (never a client one).
 */
export function Mdx({ source, autoWrapTerms = true }: { source: string; autoWrapTerms?: boolean }) {
  // The glossary is security-first, so auto-wrapping is off for tracks that do
  // not have their own glossary yet (a "socket" on the Make side is a chip
  // socket, not a network one).
  const remarkPlugins = autoWrapTerms
    ? [remarkGfm, remarkGlossaryTerms]
    : [remarkGfm];
  return (
    <div className="mdx-content">
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          parseFrontmatter: false,
          // next-mdx-remote 6 strips JS expressions by default, which silently
          // deletes every expression prop in our lessons: <Quiz answer={1}
          // options={[...]} /> arrives with only its string props and then
          // crashes on options.map. Our MDX is first-party (authored in this
          // repo, compiled from content/), so expressions are allowed, but the
          // dangerous-globals guard (eval, Function, process, require) stays on.
          //
          // If community-submitted MDX is ever rendered through this component,
          // it must NOT reuse these options.
          blockJS: false,
          blockDangerousJS: true,
          // remarkGlossaryTerms runs after gfm so it sees the final text nodes.
          // It wraps the first use of any known term, which is what makes every
          // lesson hoverable without an author marking up each one by hand.
          mdxOptions: { remarkPlugins },
        }}
      />
    </div>
  );
}
