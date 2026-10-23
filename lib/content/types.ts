/**
 * Difficulty tiers shared by lessons, machines, certs, and paths.
 */
export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "INSANE";
export type MachineOS = "LINUX" | "WINDOWS" | "ANDROID" | "OTHER";
export type TargetType = "DOCKER" | "BYO_VM" | "HOSTED";

/**
 * MDX frontmatter contracts.
 *
 * Content prose lives in `content/lessons/**.mdx` and `content/machines/**.mdx`.
 * Frontmatter is the AUTHORITATIVE source of a lesson/machine's metadata; the
 * seed/sync script reads it and upserts Module/Lesson/Machine rows in Postgres
 * (which then hold progress FKs). To add content you edit MDX + reseed - you
 * never hand-write DB rows. See CONTENT.md.
 */

export interface LessonFrontmatter {
  title: string;
  /** Module slug this lesson belongs to (e.g. "networking-foundations"). */
  module: string;
  /** Human title for the module, used when creating the Module row. */
  moduleTitle?: string;
  moduleOrder?: number;
  moduleIcon?: string;
  order: number;
  summary?: string;
  estimatedMinutes?: number;
  objectives?: string[];
  /** Lesson slugs that should be completed first. */
  prerequisites?: string[];
  tags?: string[];
  draft?: boolean;
}

export interface MachineFlagFront {
  type: "USER" | "ROOT";
  label: string;
  /** Plaintext flag (repo-private, server-only). Hashed to SHA-256 at seed; never stored plaintext in DB. */
  value: string;
  points?: number;
}

export interface MachineHintFront {
  title?: string;
  body: string;
  cost?: number;
}

export interface MachineTaskFront {
  title: string;
  description?: string;
}

export interface MachineFrontmatter {
  name: string;
  tagline?: string;
  description: string;
  difficulty: Difficulty;
  os?: MachineOS;
  targetType: TargetType;
  tags?: string[];
  points?: number;
  retired?: boolean;
  draft?: boolean;

  // Phase A - Docker target
  docker?: {
    image: string;
    run: string;
    port?: number;
    httpPath?: string;
  };

  // Phase A - Bring-your-own-VM (VulnHub) target
  byoVm?: {
    name: string;
    sourceUrl: string;
    sha256?: string;
    importNotes?: string;
  };

  // Phase B - hosted orchestration
  hosted?: {
    image: string;
    cpu?: number;
    memMb?: number;
    ttlMinutes?: number;
  };

  flags: MachineFlagFront[];
  hints?: MachineHintFront[];
  tasks?: MachineTaskFront[];
}

export interface PathItemFront {
  type: "LESSON" | "MACHINE";
  slug: string;
}

export interface PathFrontmatter {
  title: string;
  description: string;
  difficulty: Difficulty;
  order?: number;
  icon?: string;
  items: PathItemFront[];
}

export interface RawContent<T> {
  /** Path relative to its content subdir without extension, e.g. "networking-foundations/what-is-a-network". */
  contentRef: string;
  /** Derived slug (last path segment). */
  slug: string;
  frontmatter: T;
  body: string;
}
