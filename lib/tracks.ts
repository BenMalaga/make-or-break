/**
 * The two tracks the whole platform is organized around.
 *
 * Break is the offensive/defensive security and networking side, the place you
 * learn by taking things apart. Make is the building side: programming, apps,
 * AI, and hardware. A learner picks which one they are in, and the catalog,
 * paths, and home page follow that choice.
 *
 * A track is a property of a category (see lib/categories.ts), so a module
 * belongs to whichever track its category does. Kept as config, not a DB column,
 * so re-shaping tracks is a code edit rather than a migration.
 */
export type TrackId = "break" | "make";

export interface Track {
  id: TrackId;
  label: string;
  /** The verb, lowercase, for inline copy: "break things", "make things". */
  verb: string;
  tagline: string;
  description: string;
  /** LucideIcon name (see components/lucide-icon.tsx). */
  icon: string;
  /** Tailwind text color class for the track accent. */
  accentText: string;
  /** Tailwind background tint for the track accent. */
  accentBg: string;
}

export const TRACKS: Record<TrackId, Track> = {
  break: {
    id: "break",
    label: "Break",
    verb: "break things",
    tagline: "Take it apart to understand it.",
    description:
      "Cybersecurity, networking, and the offensive and defensive craft. Learn how systems work by learning how they fail, on machines you run yourself.",
    icon: "Hammer",
    accentText: "text-primary",
    accentBg: "bg-primary/10",
  },
  make: {
    id: "make",
    label: "Make",
    verb: "make things",
    tagline: "Build it to understand it.",
    description:
      "Programming, apps, AI, hardware, and the science underneath: math, physics, circuits, machines, and quantum. Learn how things work by building them, from your first line of code to a circuit board you designed.",
    icon: "Wrench",
    accentText: "text-make",
    accentBg: "bg-make/10",
  },
};

// Display order in the toggle: Make on the left, Break on the right, so it
// reads "Make ... Break". The DEFAULT selection is still Break (below), because
// Break has the most content today.
export const TRACK_IDS: TrackId[] = ["make", "break"];

export const DEFAULT_TRACK: TrackId = "break";

export function isTrackId(v: string | undefined | null): v is TrackId {
  return v === "break" || v === "make";
}
