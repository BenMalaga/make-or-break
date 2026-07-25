import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import type { Provider } from "next-auth/providers";

import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/lib/validations/auth";

/**
 * Node-runtime Auth.js instance (used by the route handler + server-side
 * `auth()`). Adds the Prisma adapter and the providers that need Node APIs.
 *
 * Session strategy is JWT (required for the Credentials provider). The adapter
 * still persists User/Account rows for OAuth sign-ins and gives us a single
 * user table across providers.
 */
const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      // `email` may be an email address or a username.
      const identifier = email.trim();
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
        },
      });
      if (!user?.hashedPassword || user.bannedAt) return null;

      const valid = await bcrypt.compare(password, user.hashedPassword);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? user.username,
        image: user.image,
        username: user.username,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      };
    },
  }),
  // Guest mode: no email or password. Creates an anonymous account so progress,
  // streaks, and writeups are tracked without any signup. The user can later
  // "claim" it by registering (see registerUser), which keeps their progress.
  Credentials({
    id: "guest",
    name: "Guest",
    credentials: {},
    async authorize() {
      // Per-IP throttle: unauthenticated guest creation writes 3 rows each, so
      // an unbounded loop could flood the DB. Cap how many guests one IP can
      // mint per hour. Returning null fails the sign-in without creating a row.
      let ip: string | null = null;
      try {
        ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      } catch {
        ip = null;
      }
      if (ip) {
        const recent = await prisma.user.count({
          where: {
            isGuest: true,
            signupIp: ip,
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        });
        if (recent >= 30) return null;
      }
      const rand = crypto.randomUUID();
      const guest = await prisma.user.create({
        data: {
          username: `hacker-${rand.slice(0, 8)}`,
          email: `guest-${rand}@guest.local`,
          role: "USER",
          isGuest: true,
          signupIp: ip,
          acceptedTermsAt: new Date(),
          profile: { create: {} },
          subscription: { create: { tier: "FREE", status: "NONE" } },
        },
      });
      return {
        id: guest.id,
        email: guest.email,
        name: guest.username,
        username: guest.username,
        role: guest.role,
        subscriptionTier: guest.subscriptionTier,
      };
    },
  }),
];

// Only offer OAuth when configured (keeps the Phase 1 zero-config path clean).
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub);
}
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
});

/** Providers exposed to the login UI (names only, no secrets). */
export const enabledOAuthProviders = providers
  .map((p) => (typeof p === "function" ? p() : p))
  .map((p) => p.id)
  .filter((id) => id !== "credentials");
