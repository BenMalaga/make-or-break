import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/auth";
import { loadConversation } from "@/lib/messages";
import { markConversationRead } from "@/lib/actions/messages";
import { MessageComposer } from "@/components/community/message-composer";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: {
    params: Promise<{ username: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return { title: `Chat with ${params.username}` };
}

export default async function ConversationPage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  const me = await requireUser();
  const convo = await loadConversation(me.id, params.username);
  if (!convo) notFound();
  // Opening the conversation clears its unread messages (idempotent).
  await markConversationRead(params.username);

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-2xl flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b pb-3">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="rounded-md p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/u/${convo.other.username}`} className="flex items-center gap-2 hover:text-primary">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {convo.other.username.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-semibold">{convo.other.username}</span>
        </Link>
      </div>

      <div className="scrollbar-thin flex flex-1 flex-col justify-end gap-2 overflow-y-auto py-4">
        {convo.messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to {convo.other.username}.
          </p>
        ) : (
          convo.messages.map((m) => (
            <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2",
                  m.fromMe ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    m.fromMe ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {formatDistanceToNow(m.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <MessageComposer recipient={convo.other.username} />
    </div>
  );
}
