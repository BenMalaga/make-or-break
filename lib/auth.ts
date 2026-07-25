import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Server-side auth helpers. Use these in server components / actions instead of
 * calling `auth()` + prisma directly, so the access pattern stays consistent.
 */

/** The current session's user id, or null. Cheap (no DB hit). */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** The full current user row, or null. */
export async function currentUser(): Promise<User | null> {
  const id = await currentUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/** Require a logged-in user or redirect to /login. Returns the full user row.
 * Bans are enforced here (not just at login) so a banned user's existing JWT
 * cannot keep acting until it naturally expires. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.bannedAt) redirect("/login");
  return user;
}
