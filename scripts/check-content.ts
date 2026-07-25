/**
 * Content linter. Enforces the contract in WRITING_GUIDELINES.md mechanically,
 * because "every lesson defines its terms and builds on the last" is a promise
 * you cannot keep by hand across hundreds of lessons.
 *
 *   npx tsx scripts/check-content.ts          # report
 *   npx tsx scripts/check-content.ts --strict # exit 1 on any error
 *
 * Imports are relative, not "@/", because tsx does not resolve tsconfig paths.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { GLOSSARY } from "../lib/glossary";

const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");
const STRICT = process.argv.includes("--strict");

// From WRITING_GUIDELINES.md.
const BANNED = [
  "delve", "leverage", "utilize", "seamless", "robust", "ever-evolving",
  "cutting-edge", "state-of-the-art", "in today's digital landscape",
  "in the realm of", "it is worth noting", "it is important to note",
  "plays a crucial role", "plays a vital role", "a testament to",
  "navigate the complexities", "game-changer", "at the end of the day",
  "that being said", "furthermore", "moreover", "in essence", "buckle up",
  "rich tapestry",
];

// Phrases that assume the reader's setup. Allowed only inside <Exercise>.
const SETUP_ASSUMING =
  /\b(your|you're|you are)\s+(kali|vm|virtual machine|attacker (box|machine)|terminal|shell|box|machine)\b/gi;

const MIN_WORDS = 1000;
const TARGET_WORDS = 1400;
const MIN_QUIZZES = 2;
const TARGET_QUIZZES = 3;

interface Issue {
  file: string;
  level: "error" | "warn";
  msg: string;
}

const issues: Issue[] = [];
const err = (file: string, msg: string) => issues.push({ file, level: "error", msg });
const warn = (file: string, msg: string) => issues.push({ file, level: "warn", msg });

/** Strip MDX component tags and code so prose checks do not fire on markup. */
function proseOnly(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<Exercise[\s\S]*?<\/Exercise>/g, " ")
    .replace(/<[^>]+>/g, " ");
}

function countWords(body: string): number {
  return proseOnly(body).split(/\s+/).filter(Boolean).length;
}

const files: string[] = [];
for (const mod of fs.readdirSync(LESSONS_DIR)) {
  const dir = path.join(LESSONS_DIR, mod);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".mdx")) files.push(path.join(dir, f));
  }
}

// Every known lesson slug, so prerequisites can be validated as real links.
const slugs = new Set(files.map((f) => path.basename(f, ".mdx")));
const order = new Map<string, { module: string; order: number }>();
for (const file of files) {
  const { data } = matter(fs.readFileSync(file, "utf8"));
  order.set(path.basename(file, ".mdx"), {
    module: String(data.module ?? ""),
    order: Number(data.order ?? 0),
  });
}

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  const { data: fm, content: body } = matter(fs.readFileSync(file, "utf8"));

  // 1. Hard formatting rules.
  if (/[—–]/.test(body)) err(rel, "contains an em-dash or en-dash");
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body)) err(rel, "contains an emoji");

  // 2. Glossary references must resolve.
  const termIds = [...body.matchAll(/<Term\s+id="([^"]+)"/g)].map((m) => m[1]);
  for (const id of new Set(termIds)) {
    if (!GLOSSARY[id]) err(rel, `<Term id="${id}"> is not in the glossary`);
  }

  // 3. Interactivity: quizzes present and spread out.
  const quizzes = [...body.matchAll(/<Quiz\b/g)].length;
  if (quizzes < MIN_QUIZZES) err(rel, `${quizzes} quizzes, need at least ${MIN_QUIZZES}`);
  else if (quizzes < TARGET_QUIZZES) warn(rel, `${quizzes} quizzes, target is ${TARGET_QUIZZES}`);

  // A zero-based answer index that overruns its options is a silently wrong quiz.
  for (const q of body.matchAll(/<Quiz[\s\S]*?\/>/g)) {
    const block = q[0];
    const ans = block.match(/answer=\{(\d+)\}/);
    const opts = block.match(/options=\{\[([\s\S]*?)\]\}/);
    if (ans && opts) {
      const n = opts[1].split(/",\s*"/).length;
      if (Number(ans[1]) >= n) {
        err(rel, `quiz answer index ${ans[1]} is out of range for ${n} options`);
      }
    }
  }

  // 4. Depth.
  const words = countWords(body);
  if (words < MIN_WORDS) err(rel, `${words} words, below the ${MIN_WORDS} floor`);
  else if (words < TARGET_WORDS) warn(rel, `${words} words, target is ${TARGET_WORDS}+`);

  // 5. Voice.
  const setup = proseOnly(body).match(SETUP_ASSUMING);
  if (setup) warn(rel, `assumes the reader's setup outside <Exercise>: ${[...new Set(setup)].join(", ")}`);

  const prose = proseOnly(body).toLowerCase();
  const hits = BANNED.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(prose));
  if (hits.length) warn(rel, `banned phrasing: ${hits.join(", ")}`);

  // 6. The prerequisite chain must be real and must point backwards.
  const prereqs: string[] = Array.isArray(fm.prerequisites) ? fm.prerequisites.map(String) : [];
  const self = order.get(path.basename(file, ".mdx"));
  for (const p of prereqs) {
    if (!slugs.has(p)) {
      err(rel, `prerequisite "${p}" is not a real lesson slug`);
      continue;
    }
    const dep = order.get(p)!;
    if (self && dep.module === self.module && dep.order >= self.order) {
      err(rel, `prerequisite "${p}" is not earlier in the module (order ${dep.order} >= ${self.order})`);
    }
  }
  if (!prereqs.length && self && self.order > 1) {
    warn(rel, "no prerequisites declared, so the chain is only implied");
  }
}

// Report.
const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");
const byFile = new Map<string, Issue[]>();
for (const i of issues) byFile.set(i.file, [...(byFile.get(i.file) ?? []), i]);

for (const [file, list] of [...byFile.entries()].sort()) {
  console.log(`\n${file}`);
  for (const i of list) console.log(`  ${i.level === "error" ? "ERROR" : "warn "}  ${i.msg}`);
}

console.log(
  `\n${files.length} lessons, ${GLOSSARY ? Object.keys(GLOSSARY).length : 0} glossary terms, ` +
    `${errors.length} errors, ${warns.length} warnings`,
);

if (STRICT && errors.length) process.exit(1);
