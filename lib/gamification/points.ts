/** Point awards for non-machine actions (machine points come from Flag rows). */
export const POINTS = {
  LESSON_COMPLETE: 10,
  FIRST_BLOOD_BONUS: 15,
  WRITEUP_PUBLISHED: 20,
  PATH_COMPLETE: 50,
} as const;

/** Categories used for the skill radar. Machine/lesson tags map onto these. */
export const SKILL_CATEGORIES = [
  "web",
  "network",
  "linux",
  "windows",
  "crypto",
  "privesc",
  "recon",
  "forensics",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/** Map an arbitrary content tag onto a skill-radar category (best effort). */
export function tagToCategory(tag: string): SkillCategory | null {
  const t = tag.toLowerCase();
  const table: Record<string, SkillCategory> = {
    web: "web",
    http: "web",
    owasp: "web",
    sqli: "web",
    xss: "web",
    network: "network",
    networking: "network",
    scanning: "network",
    nmap: "network",
    recon: "recon",
    enumeration: "recon",
    osint: "recon",
    linux: "linux",
    bash: "linux",
    windows: "windows",
    "active-directory": "windows",
    crypto: "crypto",
    cryptography: "crypto",
    hashing: "crypto",
    privesc: "privesc",
    "privilege-escalation": "privesc",
    forensics: "forensics",
    pcap: "forensics",
  };
  return table[t] ?? null;
}
