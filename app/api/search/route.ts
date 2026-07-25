import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/search?q= - global search across lessons, machines, and certs for
 * the Cmd+K palette. Auth-gated; returns a small capped result set.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ lessons: [], machines: [], certs: [] });

  const [lessons, machines, certs] = await Promise.all([
    prisma.lesson.findMany({
      where: { status: "PUBLISHED", title: { contains: q, mode: "insensitive" } },
      select: { title: true, slug: true, module: { select: { slug: true, title: true } } },
      take: 8,
    }),
    prisma.machine.findMany({
      where: { status: "PUBLISHED", name: { contains: q, mode: "insensitive" } },
      select: { name: true, slug: true },
      take: 5,
    }),
    prisma.certification.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { name: true, slug: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    lessons: lessons.map((l) => ({
      title: l.title,
      slug: l.slug,
      moduleSlug: l.module.slug,
      moduleTitle: l.module.title,
    })),
    machines,
    certs,
  });
}
