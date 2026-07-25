/**
 * Starter communities. Communities are DB rows (see the Community model) that
 * users can create, but the platform ships with these official ones seeded so
 * the place is not empty on day one. The seed upserts them by slug.
 *
 * These are NOT the Make/Break split. That identity lives in the Learn tab; the
 * community is its own space with its own topics.
 */
export interface StarterCommunity {
  slug: string;
  name: string;
  description: string;
  /** LucideIcon name (see components/lucide-icon.tsx). */
  icon: string;
}

export const STARTER_COMMUNITIES: StarterCommunity[] = [
  {
    slug: "announcements",
    name: "Announcements",
    description: "Platform news and updates.",
    icon: "Megaphone",
  },
  {
    slug: "introductions",
    name: "Introductions",
    description: "New here? Say hello and tell us what you want to learn.",
    icon: "Users",
  },
  {
    slug: "cybersecurity",
    name: "Cybersecurity",
    description: "Offense, defense, and everything in between.",
    icon: "Shield",
  },
  {
    slug: "networking",
    name: "Networking",
    description: "Packets, protocols, and how machines talk.",
    icon: "Network",
  },
  {
    slug: "ctf",
    name: "Capture the Flag",
    description: "CTF challenges, write-ups, and team-ups.",
    icon: "Flag",
  },
  {
    slug: "hardware",
    name: "Hardware and Electronics",
    description: "Circuits, microcontrollers, and building physical things.",
    icon: "Cpu",
  },
  {
    slug: "pcb-design",
    name: "PCB Design",
    description: "Schematics, layout, and getting boards made.",
    icon: "Boxes",
  },
  {
    slug: "programming",
    name: "Programming",
    description: "Code, languages, and building software.",
    icon: "Code",
  },
  {
    slug: "ai",
    name: "AI and Machine Learning",
    description: "Building with models, agents, and everything AI.",
    icon: "Brain",
  },
  {
    slug: "help",
    name: "Help and Questions",
    description: "Stuck on a lesson or a box? Ask here.",
    icon: "Target",
  },
  {
    slug: "showcase",
    name: "Showcase",
    description: "Show off a project, a build, or a hack.",
    icon: "Star",
  },
  {
    slug: "career",
    name: "Career and Learning",
    description: "Jobs, certs, and getting into the field.",
    icon: "Award",
  },
  {
    slug: "off-topic",
    name: "Off-topic",
    description: "Everything else.",
    icon: "MessageSquare",
  },
];

/** A community slug must be url-safe, lowercase, and short. */
export function normalizeCommunitySlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}
