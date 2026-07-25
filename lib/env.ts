/**
 * Centralized, typed access to feature-gating environment variables.
 *
 * Later phases (Stripe, Redis, S3, AI tutor, orchestration) are DISABLED when
 * their env is absent, so the app runs end-to-end in Phase 1 with only
 * DATABASE_URL + AUTH_SECRET set. Never throw here at import time - a missing
 * optional key should degrade a feature, not crash the build.
 */
export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Make or Break",

  oauth: {
    github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  },

  redisUrl: process.env.REDIS_URL ?? "",

  stripe: {
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
    priceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    priceTeamMonthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? "",
  },

  s3: {
    enabled: Boolean(process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET),
    bucket: process.env.S3_BUCKET ?? "",
  },

  aiTutor: {
    enabled: Boolean(process.env.AI_TUTOR_API_KEY),
    baseUrl: process.env.AI_TUTOR_BASE_URL ?? "",
    model: process.env.AI_TUTOR_MODEL ?? "",
  },

  orchestrator: {
    enabled: Boolean(process.env.ORCHESTRATOR_URL && process.env.ORCHESTRATOR_SHARED_SECRET),
    url: process.env.ORCHESTRATOR_URL ?? "",
  },
} as const;

/** Which phases are live given the current environment. Surfaced in the admin panel + docs. */
export function enabledFeatures() {
  return {
    "oauth-github": env.oauth.github,
    "oauth-google": env.oauth.google,
    redis: Boolean(env.redisUrl),
    "stripe-billing": env.stripe.enabled,
    "s3-storage": env.s3.enabled,
    "ai-tutor": env.aiTutor.enabled,
    "hosted-machines": env.orchestrator.enabled,
  };
}
