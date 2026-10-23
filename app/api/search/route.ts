import { NextResponse } from "next/server";
import { catalogLessons, catalogModules } from "@/lib/content/catalog";
import { listMachineFiles } from "@/lib/content/mdx";
import { listCerts } from "@/lib/content/certs";

/**
 * GET /api/search?q= - global search across lessons, machines, and certs for
 * the Cmd+K palette. Searches the on-disk catalog in memory; no database, no
 * auth. Returns a small capped result set.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ lessons: [], machines: [], certs: [] });
  }
  const needle = q.toLowerCase();

  const moduleTitle = new Map(catalogModules().map((m) => [m.slug, m.title]));
  const lessons = catalogLessons()
    .filter(
      (l) =>
        l.title.toLowerCase().includes(needle) ||
        l.summary.toLowerCase().includes(needle) ||
        l.tags.some((t) => t.toLowerCase().includes(needle)),
    )
    .slice(0, 8)
    .map((l) => ({
      title: l.title,
      slug: l.slug,
      module: { slug: l.moduleSlug, title: moduleTitle.get(l.moduleSlug) ?? l.moduleSlug },
    }));

  const machines = listMachineFiles()
    .filter(
      (m) =>
        m.frontmatter.name.toLowerCase().includes(needle) ||
        (m.frontmatter.tagline ?? "").toLowerCase().includes(needle) ||
        (m.frontmatter.tags ?? []).some((t) => t.toLowerCase().includes(needle)),
    )
    .slice(0, 5)
    .map((m) => ({ name: m.frontmatter.name, slug: m.slug }));

  const certs = listCerts()
    .filter(
      (c) =>
        c.cert.name.toLowerCase().includes(needle) ||
        c.cert.code.toLowerCase().includes(needle),
    )
    .slice(0, 5)
    .map((c) => ({ name: c.cert.name, code: c.cert.code, slug: c.cert.slug }));

  return NextResponse.json({ lessons, machines, certs });
}
