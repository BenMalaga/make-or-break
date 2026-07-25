import {
  Egg, Bug, Sprout, Wrench, Terminal, Skull, Zap, Brain, Crown, Trophy,
  LayoutDashboard, GraduationCap, Server, Route, FileText, Users, Shield,
  Settings, User, Circle, Flame, Star, Target, Lock, Flag, BookOpen,
  Network, Search, Globe, Activity, ShieldAlert, Wifi, KeyRound, Radar, Database,
  Mail, Fingerprint, Cloud, Award, Code, Boxes, Siren, FileSearch, Cpu, Binary,
  Hammer, Bot, Box, Wand2, Sparkles, MessageSquare, Megaphone, ArrowBigUp, Plus, TrendingUp, Clock,
  SquareTerminal, Puzzle, Sigma, Code2, Braces, Shapes,
  Building2, Webhook, CloudCog, MemoryStick, Compass, FlaskConical, Unlock, FileLock, BellRing,
  Waypoints, Container, CircuitBoard, MailWarning, Scale, Factory, Ship, ArrowUpFromLine, Biohazard,
  Smartphone, ShieldHalf, Eye, KeySquare, FileCode, ScanSearch, Microscope, ShieldCheck, ScrollText,
  Headset, Drama, Truck, Footprints, Workflow, Bomb, ClipboardCheck, Crosshair, LayoutTemplate,
  AppWindow, ChevronsUp, NotebookPen, ShieldQuestion, Medal, Swords, Binoculars,
  EyeOff, Ghost, Heart, BookMarked, GitBranch,
  type LucideIcon as LucideIconType,
} from "lucide-react";

/**
 * Curated string -> icon map for config-driven icons (nav items, rank badges,
 * module icons). Kept explicit (not the full lucide `icons` record) so the
 * client bundle only ships icons we actually use. If you reference a new icon
 * name in config, add it here.
 */
const MAP: Record<string, LucideIconType> = {
  Egg, Bug, Sprout, Wrench, Terminal, Skull, Zap, Brain, Crown, Trophy,
  LayoutDashboard, GraduationCap, Server, Route, FileText, Users, Shield,
  Settings, User, Circle, Flame, Star, Target, Lock, Flag, BookOpen,
  Network, Search, Globe, Activity, ShieldAlert, Wifi, KeyRound, Radar, Database,
  Mail, Fingerprint, Cloud, Award, Code, Boxes, Siren, FileSearch, Cpu, Binary,
  Hammer, Bot, Box, Wand2, Sparkles, MessageSquare, Megaphone, ArrowBigUp, Plus, TrendingUp, Clock,
  SquareTerminal, Puzzle, Sigma, Code2, Braces, Shapes,
  Building2, Webhook, CloudCog, MemoryStick, Compass, FlaskConical, Unlock, FileLock, BellRing,
  Waypoints, Container, CircuitBoard, MailWarning, Scale, Factory, Ship, ArrowUpFromLine, Biohazard,
  Smartphone, ShieldHalf, Eye, KeySquare, FileCode, ScanSearch, Microscope, ShieldCheck, ScrollText,
  Headset, Drama, Truck, Footprints, Workflow, Bomb, ClipboardCheck, Crosshair, LayoutTemplate,
  AppWindow, ChevronsUp, NotebookPen, ShieldQuestion, Medal, Swords, Binoculars,
  EyeOff, Ghost, Heart, BookMarked, GitBranch,
};

export function LucideIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = MAP[name] ?? Circle;
  return <Icon className={className} />;
}
