import type { ReactNode } from "react";
import {
  Info,
  Lightbulb,
  ShieldAlert,
  TriangleAlert,
  OctagonAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutType = "tip" | "warning" | "security" | "info" | "danger";

const STYLES: Record<
  CalloutType,
  { icon: typeof Info; border: string; iconColor: string; label: string }
> = {
  tip: { icon: Lightbulb, border: "border-l-success", iconColor: "text-success", label: "Tip" },
  info: { icon: Info, border: "border-l-info", iconColor: "text-info", label: "Note" },
  warning: { icon: TriangleAlert, border: "border-l-warning", iconColor: "text-warning", label: "Warning" },
  security: { icon: ShieldAlert, border: "border-l-primary", iconColor: "text-primary", label: "Security" },
  danger: { icon: OctagonAlert, border: "border-l-destructive", iconColor: "text-destructive", label: "Danger" },
};

/**
 * MDX usage:
 *   <Callout type="security" title="Authorized targets only">
 *     Only attack machines you own or are explicitly permitted to test.
 *   </Callout>
 */
export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const s = STYLES[type];
  const Icon = s.icon;
  return (
    <div className={cn("my-4 rounded-r-lg border border-l-4 bg-muted/30 p-4", s.border)}>
      <div className="mb-1 flex items-center gap-2">
        <Icon className={cn("size-4", s.iconColor)} />
        <span className="text-sm font-semibold">{title ?? s.label}</span>
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground [&>p]:m-0 [&>p+p]:mt-2">
        {children}
      </div>
    </div>
  );
}
