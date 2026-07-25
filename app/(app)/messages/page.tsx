import Link from "next/link";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/auth";
import { loadConversations } from "@/lib/messages";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const me = await requireUser();
  const convos = await loadConversations(me.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Messages" subtitle="Your direct conversations." />

      {convos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No messages yet. Open someone&apos;s profile and hit Message to start a conversation.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          {convos.map((c) => (
            <Link
              key={c.username}
              href={`/messages/${c.username}`}
              className="flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/40"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {c.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={c.unread > 0 ? "truncate font-semibold" : "truncate font-medium"}>
                    {c.username}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(c.lastAt, { addSuffix: true })}
                  </span>
                </div>
                <p
                  className={
                    c.unread > 0
                      ? "truncate text-sm text-foreground"
                      : "truncate text-sm text-muted-foreground"
                  }
                >
                  {c.fromMe ? "You: " : ""}
                  {c.lastBody}
                </p>
              </div>
              {c.unread > 0 ? (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {c.unread}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
