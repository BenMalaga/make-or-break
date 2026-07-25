import type { Difficulty } from "@prisma/client";

export const APP_NAME = "Make or Break";
export const APP_TAGLINE = "Learn offensive security by doing.";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Build phase that ships this route (informational). */
  phase?: number;
}

/** Primary sidebar navigation for the authenticated app. */
// Challenges live inside Learn (a view alongside Paths/Modules/Certifications);
// Leaderboard and Write-ups live inside Community. Kept lean on purpose.
export const APP_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", phase: 1 },
  { label: "Learn", href: "/learn", icon: "GraduationCap", phase: 2 },
  { label: "Daily Drop", href: "/daily", icon: "Target", phase: 2 },
  { label: "Build", href: "/build", icon: "SquareTerminal", phase: 2 },
  { label: "Machines", href: "/machines", icon: "Server", phase: 3 },
  { label: "Glossary", href: "/glossary", icon: "BookOpen", phase: 2 },
  { label: "Community", href: "/community", icon: "MessageSquare", phase: 5 },
];

/** Secondary links (sidebar footer cluster). Also shown in the mobile menu so
 * these pages are reachable on phones, where the sidebar footer is hidden. */
export const APP_SECONDARY_NAV: NavItem[] = [
  { label: "Messages", href: "/messages", icon: "Mail" },
  { label: "My Notes", href: "/notes", icon: "NotebookPen" },
  { label: "Resources", href: "/resources", icon: "BookMarked" },
  { label: "Support us", href: "/support", icon: "Heart" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; token: string }
> = {
  EASY: { label: "Easy", token: "easy" },
  MEDIUM: { label: "Medium", token: "medium" },
  HARD: { label: "Hard", token: "hard" },
  INSANE: { label: "Insane", token: "insane" },
};

export const OS_LABEL: Record<string, string> = {
  LINUX: "Linux",
  WINDOWS: "Windows",
  ANDROID: "Android",
  OTHER: "Other",
};

export const TARGET_TYPE_LABEL: Record<string, string> = {
  DOCKER: "Docker",
  BYO_VM: "Bring-your-own VM",
  HOSTED: "Hosted (VPN)",
};
