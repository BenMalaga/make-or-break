/**
 * Seed script. Reads MDX frontmatter under content/ and upserts the DB rows.
 * This is how content ships: author MDX, run `npm run db:seed`. Idempotent.
 *
 * Run via `npm run db:seed` (prisma db seed -> tsx prisma/seed.ts). Uses
 * relative imports (not the @/ alias) so tsx resolves them without tsconfig
 * path mapping.
 */
import { PrismaClient, type Difficulty, type MachineOS, type TargetType } from "@prisma/client";
import { listLessonFiles, listMachineFiles, listPathFiles } from "../lib/content/mdx";
import { listCerts } from "../lib/content/certs";
import { CERT_PATHS } from "../lib/cert-paths";
import { hashFlag } from "../lib/flags";
import { ACHIEVEMENTS } from "../lib/gamification/achievements";
import { STARTER_COMMUNITIES } from "../lib/forum";

const DIFFICULTIES = new Set(["EASY", "MEDIUM", "HARD", "INSANE"]);

const prisma = new PrismaClient();

async function seedModulesAndLessons() {
  const lessons = listLessonFiles();
  const moduleSlugs = new Set<string>();

  for (const l of lessons) {
    const fm = l.frontmatter;
    if (fm.draft) continue;

    if (!moduleSlugs.has(fm.module)) {
      await prisma.module.upsert({
        where: { slug: fm.module },
        update: {
          title: fm.moduleTitle ?? fm.module,
          order: fm.moduleOrder ?? 0,
          icon: fm.moduleIcon ?? "BookOpen",
        },
        create: {
          slug: fm.module,
          title: fm.moduleTitle ?? fm.module,
          description: fm.moduleTitle ?? fm.module,
          order: fm.moduleOrder ?? 0,
          icon: fm.moduleIcon ?? "BookOpen",
        },
      });
      moduleSlugs.add(fm.module);
    }

    const mod = await prisma.module.findUniqueOrThrow({ where: { slug: fm.module } });
    await prisma.lesson.upsert({
      where: { slug: l.slug },
      update: {
        moduleId: mod.id,
        title: fm.title,
        summary: fm.summary,
        contentRef: l.contentRef,
        order: fm.order,
        estimatedMinutes: fm.estimatedMinutes ?? 15,
        objectives: (fm.objectives ?? []).map(String),
        prerequisites: (fm.prerequisites ?? []).map(String),
        tags: (fm.tags ?? []).map(String),
        status: "PUBLISHED",
      },
      create: {
        slug: l.slug,
        moduleId: mod.id,
        title: fm.title,
        summary: fm.summary,
        contentRef: l.contentRef,
        order: fm.order,
        estimatedMinutes: fm.estimatedMinutes ?? 15,
        objectives: (fm.objectives ?? []).map(String),
        prerequisites: (fm.prerequisites ?? []).map(String),
        tags: (fm.tags ?? []).map(String),
        status: "PUBLISHED",
      },
    });
  }
  console.log(`  lessons: ${lessons.length}, modules: ${moduleSlugs.size}`);

  // Give each module a real one-line description from its first lesson's hook,
  // instead of repeating the module title.
  const mods = await prisma.module.findMany({
    include: { lessons: { orderBy: { order: "asc" }, take: 1, select: { summary: true } } },
  });
  for (const m of mods) {
    const summary = m.lessons[0]?.summary;
    if (summary) await prisma.module.update({ where: { id: m.id }, data: { description: summary } });
  }
}

async function seedMachines() {
  const machines = listMachineFiles();
  for (const m of machines) {
    const fm = m.frontmatter;
    if (fm.draft) continue;

    const machine = await prisma.machine.upsert({
      where: { slug: m.slug },
      update: {
        name: fm.name,
        tagline: fm.tagline,
        description: fm.description,
        contentRef: m.contentRef,
        difficulty: fm.difficulty as Difficulty,
        os: (fm.os ?? "LINUX") as MachineOS,
        targetType: fm.targetType as TargetType,
        tags: (fm.tags ?? []).map(String),
        points: fm.points ?? 20,
        retired: fm.retired ?? false,
        status: "PUBLISHED",
        dockerImage: fm.docker?.image,
        dockerRunCmd: fm.docker?.run,
        targetPort: fm.docker?.port,
        targetHttpPath: fm.docker?.httpPath,
        byoVmName: fm.byoVm?.name,
        byoVmSourceUrl: fm.byoVm?.sourceUrl,
        byoVmSha256: fm.byoVm?.sha256,
        byoVmImportNotes: fm.byoVm?.importNotes,
        hostedImage: fm.hosted?.image,
        hostedCpuLimit: fm.hosted?.cpu,
        hostedMemLimitMb: fm.hosted?.memMb,
        hostedTtlMinutes: fm.hosted?.ttlMinutes ?? 120,
      },
      create: {
        slug: m.slug,
        name: fm.name,
        tagline: fm.tagline,
        description: fm.description,
        contentRef: m.contentRef,
        difficulty: fm.difficulty as Difficulty,
        os: (fm.os ?? "LINUX") as MachineOS,
        targetType: fm.targetType as TargetType,
        tags: (fm.tags ?? []).map(String),
        points: fm.points ?? 20,
        retired: fm.retired ?? false,
        status: "PUBLISHED",
        dockerImage: fm.docker?.image,
        dockerRunCmd: fm.docker?.run,
        targetPort: fm.docker?.port,
        targetHttpPath: fm.docker?.httpPath,
        byoVmName: fm.byoVm?.name,
        byoVmSourceUrl: fm.byoVm?.sourceUrl,
        byoVmSha256: fm.byoVm?.sha256,
        byoVmImportNotes: fm.byoVm?.importNotes,
        hostedImage: fm.hosted?.image,
        hostedCpuLimit: fm.hosted?.cpu,
        hostedMemLimitMb: fm.hosted?.memMb,
        hostedTtlMinutes: fm.hosted?.ttlMinutes ?? 120,
      },
    });

    // Rebuild flags/hints/tasks from frontmatter (idempotent).
    await prisma.flag.deleteMany({ where: { machineId: machine.id } });
    await prisma.hint.deleteMany({ where: { machineId: machine.id } });
    await prisma.machineTask.deleteMany({ where: { machineId: machine.id } });

    for (const f of fm.flags) {
      await prisma.flag.create({
        data: {
          machineId: machine.id,
          type: f.type,
          label: f.label,
          hash: hashFlag(f.value),
          points: f.points ?? 10,
        },
      });
    }
    await prisma.hint.createMany({
      data: (fm.hints ?? []).map((h, i) => ({
        machineId: machine.id,
        order: i + 1,
        title: h.title ?? null,
        body: h.body,
        pointCost: h.cost ?? 0,
      })),
    });
    await prisma.machineTask.createMany({
      data: (fm.tasks ?? []).map((t, i) => ({
        machineId: machine.id,
        order: i + 1,
        title: t.title,
        description: t.description ?? null,
      })),
    });
  }
  console.log(`  machines: ${machines.length}`);
}

async function seedPaths() {
  const paths = listPathFiles();
  for (const p of paths) {
    const fm = p.frontmatter;
    const path = await prisma.path.upsert({
      where: { slug: p.slug },
      update: {
        title: fm.title,
        description: fm.description,
        difficulty: fm.difficulty as Difficulty,
        order: fm.order ?? 0,
        icon: fm.icon,
      },
      create: {
        slug: p.slug,
        title: fm.title,
        description: fm.description,
        difficulty: fm.difficulty as Difficulty,
        order: fm.order ?? 0,
        icon: fm.icon,
      },
    });

    await prisma.pathItem.deleteMany({ where: { pathId: path.id } });
    let order = 0;
    for (const item of fm.items ?? []) {
      if (item.type === "LESSON") {
        const lesson = await prisma.lesson.findUnique({ where: { slug: item.slug } });
        if (!lesson) {
          console.warn(`  ! path ${p.slug}: lesson "${item.slug}" not found, skipping`);
          continue;
        }
        await prisma.pathItem.create({
          data: { pathId: path.id, order: order++, type: "LESSON", lessonId: lesson.id },
        });
      } else {
        const machine = await prisma.machine.findUnique({ where: { slug: item.slug } });
        if (!machine) {
          console.warn(`  ! path ${p.slug}: machine "${item.slug}" not found, skipping`);
          continue;
        }
        await prisma.pathItem.create({
          data: { pathId: path.id, order: order++, type: "MACHINE", machineId: machine.id },
        });
      }
    }
  }
  console.log(`  paths: ${paths.length}`);
}

async function seedCerts() {
  const certs = listCerts();
  for (const { cert, questions } of certs) {
    const c = await prisma.certification.upsert({
      where: { slug: cert.slug },
      update: {
        code: cert.code,
        name: cert.name,
        vendor: cert.vendor,
        description: cert.description,
        passScore: cert.passScore,
        examMinutes: cert.examMinutes,
        questionCount: cert.questionCount,
        icon: cert.icon,
        order: cert.order ?? 0,
      },
      create: {
        slug: cert.slug,
        code: cert.code,
        name: cert.name,
        vendor: cert.vendor,
        description: cert.description,
        passScore: cert.passScore,
        examMinutes: cert.examMinutes,
        questionCount: cert.questionCount,
        icon: cert.icon,
        order: cert.order ?? 0,
      },
    });

    const domainIdByNumber = new Map<number, string>();
    for (const d of cert.domains) {
      const dom = await prisma.examDomain.upsert({
        where: { certificationId_number: { certificationId: c.id, number: d.number } },
        update: { name: d.name, weight: d.weight },
        create: { certificationId: c.id, number: d.number, name: d.name, weight: d.weight },
      });
      domainIdByNumber.set(d.number, dom.id);
    }

    await prisma.examQuestion.deleteMany({ where: { certificationId: c.id } });
    const data = questions
      .filter(
        (q) =>
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          Array.isArray(q.correct) &&
          q.correct.length >= 1 &&
          q.correct.every((i) => i >= 0 && i < q.options.length),
      )
      .map((q) => ({
        certificationId: c.id,
        domainId: domainIdByNumber.get(q.domain) ?? null,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation ?? "",
        difficulty: (DIFFICULTIES.has(q.difficulty ?? "") ? q.difficulty! : "MEDIUM") as
          | "EASY"
          | "MEDIUM"
          | "HARD"
          | "INSANE",
      }));
    if (data.length) await prisma.examQuestion.createMany({ data });
    console.log(`  cert ${cert.slug}: ${cert.domains.length} domains, ${data.length} questions`);
  }
}

async function seedCertPaths() {
  for (const cp of CERT_PATHS) {
    const cert = await prisma.certification.findUnique({ where: { slug: cp.certSlug } });
    if (!cert) {
      console.warn(`  ! cert-path: certification ${cp.certSlug} not found`);
      continue;
    }
    const data = {
      title: cp.title,
      description: cp.description,
      difficulty: "MEDIUM" as const,
      icon: cert.icon ?? "Award",
      order: 100 + (cert.order ?? 0),
      certificationId: cert.id,
    };
    const path = await prisma.path.upsert({
      where: { slug: `${cp.certSlug}-path` },
      update: data,
      create: { slug: `${cp.certSlug}-path`, ...data },
    });
    await prisma.pathItem.deleteMany({ where: { pathId: path.id } });
    let order = 0;
    for (const slug of cp.lessonSlugs) {
      const lesson = await prisma.lesson.findUnique({ where: { slug } });
      if (!lesson) {
        console.warn(`  ! cert-path ${cp.certSlug}: lesson ${slug} missing`);
        continue;
      }
      await prisma.pathItem.create({
        data: { pathId: path.id, order: order++, type: "LESSON", lessonId: lesson.id },
      });
    }
    console.log(`  cert-path ${cp.certSlug}: ${order} lessons`);
  }
}

async function seedAchievements() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: { name: a.name, description: a.description, icon: a.icon, category: a.category, points: a.points },
      create: a,
    });
  }
  console.log(`  achievements: ${ACHIEVEMENTS.length}`);
}

async function seedCommunities() {
  for (const c of STARTER_COMMUNITIES) {
    await prisma.community.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, icon: c.icon, official: true },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon,
        official: true,
      },
    });
  }
  console.log(`  communities: ${STARTER_COMMUNITIES.length} official`);
}

async function main() {
  console.log("Seeding Make or Break...");
  await seedModulesAndLessons();
  await seedMachines();
  await seedPaths();
  await seedCerts();
  await seedCertPaths();
  await seedAchievements();
  await seedCommunities();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
