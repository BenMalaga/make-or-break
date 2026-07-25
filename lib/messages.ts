import "server-only";
import { prisma } from "@/lib/db";

export interface ConversationSummary {
  username: string;
  image: string | null;
  lastBody: string;
  lastAt: Date;
  fromMe: boolean;
  unread: number;
}

/** One row per person the user has exchanged messages with, newest first. */
export async function loadConversations(userId: string): Promise<ConversationSummary[]> {
  const msgs = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      senderId: true,
      recipientId: true,
      body: true,
      createdAt: true,
      readAt: true,
      sender: { select: { username: true, image: true } },
      recipient: { select: { username: true, image: true } },
    },
  });

  const byOther = new Map<string, ConversationSummary>();
  for (const m of msgs) {
    const fromMe = m.senderId === userId;
    const other = fromMe ? m.recipient : m.sender;
    const otherId = fromMe ? m.recipientId : m.senderId;
    let row = byOther.get(otherId);
    if (!row) {
      // msgs are newest-first, so the first one seen for a person is the latest.
      row = {
        username: other.username,
        image: other.image,
        lastBody: m.body,
        lastAt: m.createdAt,
        fromMe,
        unread: 0,
      };
      byOther.set(otherId, row);
    }
    if (!fromMe && m.readAt === null) row.unread += 1;
  }
  return [...byOther.values()].sort((a, b) => +b.lastAt - +a.lastAt);
}

export interface DmMessage {
  id: string;
  body: string;
  createdAt: Date;
  fromMe: boolean;
}

/** The full message thread between the user and one other person. */
export async function loadConversation(
  userId: string,
  otherUsername: string,
): Promise<{ other: { username: string; image: string | null }; messages: DmMessage[] } | null> {
  const other = await prisma.user.findUnique({
    where: { username: otherUsername },
    select: { id: true, username: true, image: true },
  });
  if (!other) return null;

  const rows = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: other.id },
        { senderId: other.id, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 1000,
    select: { id: true, body: true, createdAt: true, senderId: true },
  });

  return {
    other: { username: other.username, image: other.image },
    messages: rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      fromMe: r.senderId === userId,
    })),
  };
}

/** Total unread messages for the header/nav badge. */
export function unreadMessageCount(userId: string): Promise<number> {
  return prisma.directMessage.count({ where: { recipientId: userId, readAt: null } });
}
