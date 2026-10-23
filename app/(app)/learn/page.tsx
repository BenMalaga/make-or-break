import type { Metadata } from "next";
import { categoriesForTrack, categoryForModule } from "@/lib/categories";
import { TRACKS, DEFAULT_TRACK, isTrackId, type TrackId } from "@/lib/tracks";
import { TrackToggle } from "@/components/learn/track-toggle";
import { ViewToggle } from "@/components/learn/view-toggle";
import { PageHeader } from "@/components/layout/page-header";
import {
  LearnCatalog,
  type CertCardData,
  type PathCardData,
} from "@/components/learn/learn-catalog";
import type { CategoryGroup, ModuleCard } from "@/components/learn/academy-browser";
import { catalogLesson, catalogModuleLessons, catalogModules } from "@/lib/content/catalog";
import { listPathFiles } from "@/lib/content/mdx";
import { listCerts } from "@/lib/content/certs";
import { listChallenges } from "@/lib/challenges";

export const metadata: Metadata = { title: "Learn" };

// A path has no track of its own; derive it from the modules of its lessons.
// Machine-only and security paths default to Break.
function pathTrackOfSlugs(moduleSlugs: (string | undefined)[]): TrackId {
  let make = 0;
  let brk = 0;
  for (const slug of moduleSlugs) {
    const t = slug ? (categoryForModule(slug)?.track ?? null) : null;
    if (t === "make") make++;
    else if (t === "break") brk++;
  }
  return make > brk ? "make" : "break";
}

export default async function LearnPage(props: {
  searchParams: Promise<{ track?: string; view?: string }>;
}) {
  const searchParams = await props.searchParams;
  const track = isTrackId(searchParams.track) ? searchParams.track : DEFAULT_TRACK;
  const meta = TRACKS[track];

  // ---- Module catalog (per track) ------------------------------------------
  const modules = catalogModules();
  const bySlug = new Map(modules.map((m) => [m.slug, m]));
  // The first lesson's summary doubles as the module description, as the old
  // seed did when it copied content into the database.
  const toCard = (slug: string): ModuleCard | null => {
    const m = bySlug.get(slug);
    if (!m) return null;
    return {
      slug: m.slug,
      title: m.title,
      description: catalogModuleLessons(slug)[0]?.summary || m.title,
      icon: m.icon,
      lessonSlugs: m.lessonSlugs,
    };
  };

  const trackCategories = categoriesForTrack(track);
  const groups: CategoryGroup[] = trackCategories
    .map((cat) => ({
      slug: cat.slug,
      label: cat.label,
      icon: cat.icon,
      blurb: cat.blurb,
      comingSoon: cat.comingSoon,
      modules: cat.moduleSlugs.map(toCard).filter((m): m is ModuleCard => m !== null),
    }))
    .filter((g) => g.modules.length > 0 || g.comingSoon);

  if (track === "break") {
    const categorized = new Set(trackCategories.flatMap((c) => c.moduleSlugs));
    const others = modules
      .filter((m) => !categorized.has(m.slug))
      .map((m) => toCard(m.slug))
      .filter((m): m is ModuleCard => m !== null);
    if (others.length) {
      groups.push({ slug: "more", label: "More", icon: "BookOpen", blurb: "", modules: others });
    }
  }

  // ---- Paths (per track) ----------------------------------------------------
  const pathFiles = [...listPathFiles()].sort(
    (a, b) => (a.frontmatter.order ?? 0) - (b.frontmatter.order ?? 0),
  );
  const toPathCard = (raw: (typeof pathFiles)[number]): PathCardData => {
    const lessonSlugs: string[] = [];
    const machineSlugs: string[] = [];
    for (const it of raw.frontmatter.items) {
      if (it.type === "LESSON") {
        const l = catalogLesson(it.slug);
        if (l) lessonSlugs.push(l.slug);
      } else {
        machineSlugs.push(it.slug);
      }
    }
    return {
      slug: raw.slug,
      title: raw.frontmatter.title,
      description: raw.frontmatter.description,
      icon: raw.frontmatter.icon ?? null,
      difficulty: raw.frontmatter.difficulty,
      lessonSlugs,
      machineSlugs,
    };
  };
  const trackPaths = pathFiles.filter(
    (p) =>
      pathTrackOfSlugs(
        p.frontmatter.items
          .filter((i) => i.type === "LESSON")
          .map((i) => catalogLesson(i.slug)?.moduleSlug),
      ) === track,
  );
  const paths = trackPaths.map(toPathCard);

  // ---- Certifications -------------------------------------------------------
  // Cert prep content is all security material, so certs sit on the Break track.
  const certs: CertCardData[] =
    track === "break"
      ? listCerts()
          .sort((a, b) => (a.cert.order ?? 0) - (b.cert.order ?? 0))
          .map(({ cert, questions }) => ({
            slug: cert.slug,
            code: cert.code,
            name: cert.name,
            vendor: cert.vendor,
            description: cert.description,
            icon: cert.icon ?? null,
            examMinutes: cert.examMinutes,
            questionCount: questions.length,
            domainCount: cert.domains.length,
          }))
      : [];

  // ---- Challenges -----------------------------------------------------------
  const challenges = listChallenges();

  // Default to guided paths when the track has them, else jump to the catalog.
  const view =
    searchParams.view === "modules"
      ? "modules"
      : searchParams.view === "certs"
        ? "certs"
        : searchParams.view === "challenges"
          ? "challenges"
          : searchParams.view === "paths"
            ? "paths"
            : paths.length > 0
              ? "paths"
              : "modules";

  const trackModuleCount = groups.reduce((s, g) => s + g.modules.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Learn" subtitle={meta.tagline} action={<TrackToggle active={track} />} />

      <ViewToggle active={view} />

      <LearnCatalog
        track={track}
        trackLabel={meta.label}
        view={view}
        groups={groups}
        paths={paths}
        certs={certs}
        challenges={challenges}
        trackModuleCount={trackModuleCount}
      />
    </div>
  );
}
