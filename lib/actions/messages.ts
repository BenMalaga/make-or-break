"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { directMessagesOverLimit } from "@/lib/rate-limit";

/** Send a direct message to another user by username. */
export async function sendDirectMessage(
  recipientUsername: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireUser();
  const text = body.trim();
  if (!text) return { ok: false, error: "Write a message first." };
  if (text.length > 5000) return { ok: false, error: "That message is too long." };
  if (await directMessagesOverLimit(me.id)) {
    return { ok: false, error: "You are sending messages too fast. Slow down a moment." };
  }

  const recipient = await prisma.user.findUnique({
    where: { username: recipientUsername },
    select: { id: true },
  });
  if (!recipient) return { ok: false, error: "That user does not exist." };
  if (recipient.id === me.id) return { ok: false, error: "You cannot message yourself." };

  await prisma.directMessage.create({
    data: { senderId: me.id, recipientId: recipient.id, body: text },
  });
  revalidatePath(`/messages/${recipientUsername}`);
  revalidatePath("/messages");
  return { ok: true };
}

/** Mark every message from the other user to me as read. */
export async function markConversationRead(otherUsername: string): Promise<void> {
  const me = await requireUser();
  const other = await prisma.user.findUnique({
    where: { username: otherUsername },
    select: { id: true },
  });
  if (!other) return;
  await prisma.directMessage.updateMany({
    where: { senderId: other.id, recipientId: me.id, readAt: null },
    data: { readAt: new Date() },
  });
}
