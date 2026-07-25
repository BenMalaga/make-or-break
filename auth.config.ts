import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config.
 *
 * This half contains ONLY code that can run in the Edge runtime (no Prisma, no
 * bcrypt). `middleware.ts` builds a NextAuth instance from this to verify the
 * JWT session and enforce route protection. The Node-only half (Credentials +
 * Prisma adapter) lives in `auth.ts`.
 */

// Route prefixes that require an authenticated session.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/learn",
  "/machines",
  "/paths",
  "/certs",
  "/profile",
  "/settings",
  "/writeups",
  "/teams",
  "/admin",
];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // populated in auth.ts (Node runtime)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PREFIXES.some((p) =>
        nextUrl.pathname.startsWith(p),
      );
      // Admin area additionally requires the ADMIN role.
      if (nextUrl.pathname.startsWith("/admin")) {
        return isLoggedIn && auth?.user?.role === "ADMIN";
      }
      if (isProtected) return isLoggedIn;
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.username = (user.username as string) ?? token.username;
        token.role = (user.role as JwtRole) ?? "USER";
        token.subscriptionTier = (user.subscriptionTier as JwtTier) ?? "FREE";
      }
      // Allow client-side session.update() to refresh cached fields.
      if (trigger === "update" && session?.user) {
        token.username = session.user.username ?? token.username;
        token.subscriptionTier = session.user.subscriptionTier ?? token.subscriptionTier;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as JwtRole;
        session.user.subscriptionTier = token.subscriptionTier as JwtTier;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

// Local aliases to avoid importing Prisma enums into the edge bundle.
type JwtRole = "USER" | "CREATOR" | "ADMIN";
type JwtTier = "FREE" | "PRO" | "TEAM";
