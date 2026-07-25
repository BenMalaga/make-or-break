"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const MAX_TITLE = 160;
const MAX_BODY = 60000;

type Result = { ok: false; error: string } | { ok: true; redirect: string };

/**
 * Create or update the current user's write-up for a machine (one per machine,
 * enforced by a unique constraint). Publishing makes it visible to everyone.
 */
export async function saveWriteup(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const machineId = String(formData.get("machineId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const publish = formData.get("publish") === "on";

  if (!machineId) return { ok: false, error: "Pick which machine this write-up is about." };
  const machine = await prisma.machine.findUnique({ where: { id: machineId }, select: { id: true } });
  if (!machine) return { ok: false, error: "That machine no longer exists." };
  if (title.length < 4) return { ok: false, error: "Give the write-up a title (at least 4 characters)." };
  if (title.length > MAX_TITLE) return { ok: false, error: "That title is too long." };
  if (body.length < 20) return { ok: false, error: "Write a bit more before saving." };
  if (body.length > MAX_BODY) return { ok: false, error: "That write-up is too long." };

  const writeup = await prisma.writeup.upsert({
    where: { userId_machineId: { userId: user.id, machineId } },
    update: { title, contentMdx: body, status: publish ? "PUBLISHED" : "DRAFT" },
    create: {
      userId: user.id,
      machineId,
      title,
      contentMdx: body,
      status: publish ? "PUBLISHED" : "DRAFT",
    },
    select: { id: true },
  });

  revalidatePath("/writeups");
  return { ok: true, redirect: `/writeups/${writeup.id}` };
}

export async function submitWriteup(formData: FormData) {
  const res = await saveWriteup(formData);
  if (res.ok) redirect(res.redirect);
  redirect(`/writeups/new?error=${encodeURIComponent(res.error)}`);
}
