import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  LessonFrontmatter,
  MachineFrontmatter,
  PathFrontmatter,
  RawContent,
} from "./types";

/**
 * Filesystem access to MDX content. SERVER ONLY - imported by server
 * components, server actions, and the seed script. Never import from a client
 * component (it uses node:fs).
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".mdx") && !entry.name.endsWith(".walkthrough.mdx")) {
      out.push(full);
    }
  }
  return out;
}

function readRaw<T>(subdir: string, file: string): RawContent<T> {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const rel = path
    .relative(path.join(CONTENT_DIR, subdir), file)
    .replace(/\.mdx$/, "");
  const slug = path.basename(rel);
  return { contentRef: rel, slug, frontmatter: data as T, body: content };
}

// ---- Lessons ----------------------------------------------------------------

export function listLessonFiles(): RawContent<LessonFrontmatter>[] {
  return walk(path.join(CONTENT_DIR, "lessons")).map((f) =>
    readRaw<LessonFrontmatter>("lessons", f),
  );
}

export function readLesson(contentRef: string): RawContent<LessonFrontmatter> | null {
  const file = path.join(CONTENT_DIR, "lessons", `${contentRef}.mdx`);
  if (!fs.existsSync(file)) return null;
  return readRaw<LessonFrontmatter>("lessons", file);
}

// ---- Machines ---------------------------------------------------------------

export function listMachineFiles(): RawContent<MachineFrontmatter>[] {
  return walk(path.join(CONTENT_DIR, "machines")).map((f) =>
    readRaw<MachineFrontmatter>("machines", f),
  );
}

export function readMachine(contentRef: string): RawContent<MachineFrontmatter> | null {
  const file = path.join(CONTENT_DIR, "machines", `${contentRef}.mdx`);
  if (!fs.existsSync(file)) return null;
  return readRaw<MachineFrontmatter>("machines", file);
}

// ---- Paths ------------------------------------------------------------------

export function listPathFiles(): RawContent<PathFrontmatter>[] {
  return walk(path.join(CONTENT_DIR, "paths")).map((f) =>
    readRaw<PathFrontmatter>("paths", f),
  );
}

/**
 * Machine walkthroughs live beside the machine file as `<name>.walkthrough.mdx`
 * and are only ever read server-side AFTER an ownership/retired check, so the
 * spoiler never reaches an unauthorized client.
 */
export function readMachineWalkthrough(contentRef: string): string | null {
  const file = path.join(CONTENT_DIR, "machines", `${contentRef}.walkthrough.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  return matter(raw).content;
}
