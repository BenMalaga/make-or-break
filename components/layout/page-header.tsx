import type { ReactNode } from "react";

/**
 * The one page header for top-level pages. Left-aligned title + muted subtitle,
 * with an optional right-aligned action (a toggle, a button). Using this keeps
 * every page's header the same size and position instead of each page inventing
 * its own. Pages render it as the first child of a `space-y-6` container inside
 * MainContainer, so it lines up with the guest banner and everything below.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
