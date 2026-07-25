"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

type RegisterResult =
  | { ok: true; converted: boolean }
  | { ok: false; error: string; field?: keyof RegisterInput };

/**
 * Create a new account. Does NOT sign the user in - the client calls
 * `signIn("credentials", ...)` after a successful create so credential errors
 * and account-creation errors stay cleanly separated.
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: first.path[0] as keyof RegisterInput };
  }

  const { username, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const [emailTaken, usernameTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail } }),
    prisma.user.findUnique({ where: { username } }),
  ]);
  if (emailTaken) return { ok: false, error: "That email is already registered", field: "email" };
  if (usernameTaken) return { ok: false, error: "That username is taken", field: "username" };

  const hashedPassword = await bcrypt.hash(password, 12);

  // If the current visitor is a guest, claim that account so their progress,
  // streaks, and writeups carry over. Otherwise create a fresh account.
  const session = await auth();
  const currentId = session?.user?.id;
  if (currentId) {
    const current = await prisma.user.findUnique({
      where: { id: currentId },
      select: { isGuest: true },
    });
    if (current?.isGuest) {
      await prisma.user.update({
        where: { id: currentId },
        data: { username, email: normalizedEmail, hashedPassword, isGuest: false },
      });
      return { ok: true, converted: true };
    }
  }

  await prisma.user.create({
    data: {
      username,
      email: normalizedEmail,
      hashedPassword,
      acceptedTermsAt: new Date(),
      profile: { create: {} },
      subscription: { create: { tier: "FREE", status: "NONE" } },
    },
  });

  return { ok: true, converted: false };
}
