import type { Role, SubscriptionTier } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augment the session + JWT with the app-specific fields we set in callbacks.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      subscriptionTier: SubscriptionTier;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    role?: Role;
    subscriptionTier?: SubscriptionTier;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
    subscriptionTier: SubscriptionTier;
  }
}
