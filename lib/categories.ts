/**
 * Module taxonomy for the Academy. Groups the module catalog into browsable
 * categories, each belonging to a track (Break or Make). Kept as config (not a
 * DB column) so re-categorizing is a code edit, not a migration. Every published
 * module slug should appear exactly once; any that does not is shown under
 * "More" on the Learn page.
 *
 * A category with `comingSoon` has no built content yet: it renders as a roadmap
 * card so the planned curriculum is visible before it exists.
 */
import type { TrackId } from "./tracks";

export interface ModuleCategory {
  slug: string;
  label: string;
  icon: string;
  blurb: string;
  track: TrackId;
  moduleSlugs: string[];
  comingSoon?: boolean;
}

type BaseCategory = Omit<ModuleCategory, "track">;

// The offensive/defensive security and networking catalog. This is the built,
// shipping content: 53 modules across these categories.
const BREAK_CATEGORIES: BaseCategory[] = [
  {
    slug: "foundations",
    label: "Foundations",
    icon: "Sprout",
    blurb: "The groundwork everything else stands on.",
    moduleSlugs: [
      "networking-foundations",
      "networking-deep-dive",
      "linux-for-security",
      "windows-fundamentals",
      "python-for-security",
      "docker-and-containers",
      "building-a-home-lab",
    ],
  },
  {
    slug: "personal-security",
    label: "Personal Security and Privacy",
    icon: "EyeOff",
    blurb: "Protect yourself online: privacy, OPSEC, and not getting owned.",
    moduleSlugs: ["digital-self-defense"],
  },
  {
    slug: "recon",
    label: "Reconnaissance",
    icon: "Search",
    blurb: "Find the target and everything it leaks before you touch it.",
    moduleSlugs: ["recon-and-scanning", "osint", "traffic-analysis"],
  },
  {
    slug: "web",
    label: "Web and Application Security",
    icon: "Globe",
    blurb: "The biggest attack surface there is.",
    moduleSlugs: [
      "web-and-http",
      "web-application-attacks",
      "advanced-web-attacks",
      "burp-suite",
      "api-security",
      "secure-coding",
    ],
  },
  {
    slug: "exploitation",
    label: "Exploitation and Offense",
    icon: "Zap",
    blurb: "Turning a weakness into access.",
    moduleSlugs: [
      "vulnerabilities-and-exploitation",
      "metasploit",
      "password-attacks",
      "social-engineering",
      "binary-exploitation",
      "reverse-engineering",
      "ctf-methodology",
    ],
  },
  {
    slug: "privesc",
    label: "Privilege Escalation and AD",
    icon: "Wrench",
    blurb: "From a shell to full control, on Linux, Windows, and the domain.",
    moduleSlugs: [
      "linux-privilege-escalation",
      "windows-privilege-escalation",
      "active-directory",
    ],
  },
  {
    slug: "wireless-mobile-hardware",
    label: "Wireless, Mobile, and Hardware",
    icon: "Wifi",
    blurb: "Attacking the things that are not a server.",
    moduleSlugs: ["wireless-security", "mobile-security", "iot-and-ot-security"],
  },
  {
    slug: "cryptography",
    label: "Cryptography",
    icon: "KeyRound",
    blurb: "How crypto works, and how it fails.",
    moduleSlugs: ["cryptography", "cryptographic-attacks"],
  },
  {
    slug: "blue-team",
    label: "Blue Team and Defense",
    icon: "Radar",
    blurb: "Detecting, hunting, and responding to the attacks above.",
    moduleSlugs: [
      "soc-analyst-fundamentals",
      "siem-and-log-analysis",
      "threat-hunting",
      "detection-engineering",
      "threat-intelligence",
      "malware-analysis",
      "digital-forensics",
      "incident-response",
      "network-defense",
      "email-security",
    ],
  },
  {
    slug: "cloud",
    label: "Cloud and Infrastructure",
    icon: "Cloud",
    blurb: "Where most workloads (and breaches) now live.",
    moduleSlugs: [
      "cloud-security-fundamentals",
      "aws-security",
      "kubernetes-security",
      "dns-and-network-services-security",
    ],
  },
  {
    slug: "identity-data",
    label: "Identity and Data",
    icon: "Fingerprint",
    blurb: "The new perimeter and the thing you are actually protecting.",
    moduleSlugs: [
      "identity-and-access-management",
      "zero-trust-architecture",
      "data-protection-and-privacy",
      "supply-chain-security",
    ],
  },
  {
    slug: "governance-career",
    label: "Governance and Career",
    icon: "Award",
    blurb: "The business of security, and building your own path in it.",
    moduleSlugs: [
      "grc-and-frameworks",
      "vulnerability-management",
      "threat-modeling",
      "writing-security-reports",
      "breaking-into-security",
    ],
  },
];

// The building side: programming, apps, AI, and hardware. Programming
// Foundations is built; the rest are the published roadmap, shown as coming-soon
// cards until their lessons exist. Add real moduleSlugs and drop `comingSoon` as
// each module ships.
const MAKE_CATEGORIES: BaseCategory[] = [
  {
    slug: "make-programming",
    label: "Programming",
    icon: "Code",
    blurb: "Write your first line of code, then learn to think like a programmer.",
    moduleSlugs: [
      "programming-foundations",
      "python-intro",
      "python-deep-dive",
      "git-and-version-control",
      "sql-and-databases",
      "debugging-and-testing",
    ],
  },
  {
    slug: "make-scripting",
    label: "Scripting and Automation",
    icon: "SquareTerminal",
    blurb: "Automate real work on the command line. PowerShell, the shell that passes objects instead of plain text.",
    moduleSlugs: ["powershell"],
  },
  {
    slug: "make-math",
    label: "Math and Logic",
    icon: "Sigma",
    blurb:
      "From primes and modular arithmetic to functions, vectors, and calculus: the toolkit every other subject here runs on.",
    moduleSlugs: ["math-and-logic", "math-foundations"],
  },
  {
    slug: "make-apps",
    label: "Building Apps",
    icon: "Globe",
    blurb: "Turn code into real web and mobile apps people can use.",
    moduleSlugs: ["web-development", "backends-and-apis"],
  },
  {
    slug: "make-ai",
    label: "Building with AI",
    icon: "Brain",
    blurb: "Build apps on top of language models, and the agents that use tools.",
    moduleSlugs: ["building-with-ai"],
  },
  {
    slug: "make-gis",
    label: "GIS and Mapping",
    icon: "Compass",
    blurb: "Work with maps and location data: from what a coordinate system is to spatial analysis, GIS programming, and web maps.",
    moduleSlugs: [
      "gis-foundations",
      "gis-data-formats",
      "gis-spatial-analysis",
      "gis-python",
      "gis-postgis",
      "gis-web-mapping",
    ],
  },
  {
    slug: "make-electronics",
    label: "Electrical Engineering",
    icon: "Cpu",
    blurb: "From what a volt is to op-amps: the circuits, components, and analysis every board is built from.",
    moduleSlugs: ["electronics-foundations", "circuit-analysis"],
  },
  {
    slug: "make-physics",
    label: "Physics",
    icon: "FlaskConical",
    blurb: "How the physical world actually works: motion, forces, energy, waves, and fields.",
    moduleSlugs: ["physics-foundations"],
  },
  {
    slug: "make-mechanical",
    label: "Mechanical Engineering",
    icon: "Factory",
    blurb: "Structures, materials, mechanisms, and machines: how things hold up, move, and get made.",
    moduleSlugs: ["mechanical-foundations"],
  },
  {
    slug: "make-quantum",
    label: "Quantum",
    icon: "Microscope",
    blurb: "What the world is made of at the smallest scales, and how quantum computers actually work.",
    moduleSlugs: ["quantum-foundations"],
  },
  {
    slug: "make-pcb",
    label: "PCB Design",
    icon: "Boxes",
    blurb: "Design a real circuit board and send it out to be manufactured.",
    moduleSlugs: [],
    comingSoon: true,
  },
  {
    slug: "make-firmware",
    label: "Firmware and Embedded",
    icon: "Binary",
    blurb: "Program the tiny computers inside hardware.",
    moduleSlugs: [],
    comingSoon: true,
  },
  {
    slug: "make-robotics",
    label: "Robotics",
    icon: "Bot",
    blurb: "Make things sense, move, and act in the physical world.",
    moduleSlugs: [],
    comingSoon: true,
  },
  {
    slug: "make-cad",
    label: "3D and CAD",
    icon: "Box",
    blurb: "Model parts and print them, or send them to a machine shop.",
    moduleSlugs: [],
    comingSoon: true,
  },
];

/** All categories, with their track attached. */
export const MODULE_CATEGORIES: ModuleCategory[] = [
  ...BREAK_CATEGORIES.map((c) => ({ ...c, track: "break" as const })),
  ...MAKE_CATEGORIES.map((c) => ({ ...c, track: "make" as const })),
];

/** Categories for one track, in order. */
export function categoriesForTrack(track: TrackId): ModuleCategory[] {
  return MODULE_CATEGORIES.filter((c) => c.track === track);
}

/** Reverse lookup: module slug -> category (or null). */
export function categoryForModule(moduleSlug: string): ModuleCategory | null {
  return MODULE_CATEGORIES.find((c) => c.moduleSlugs.includes(moduleSlug)) ?? null;
}
