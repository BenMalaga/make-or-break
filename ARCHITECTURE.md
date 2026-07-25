# Architecture

This document covers the topology, the data model, the key design decisions
(with tradeoffs), and the 8-phase build plan. It is the map for extending the
platform.

## Topology

```
                    ┌─────────────────────────────┐
   Browser  ───────▶│  Next.js (App Router)        │
                    │  - RSC pages + server actions │
                    │  - Auth.js (JWT sessions)     │
                    │  - API routes                 │
                    │  Deploy: Vercel               │
                    └───────────┬─────────┬─────────┘
                                │         │
                     Prisma     │         │  (later phases, feature-gated)
                                ▼         ▼
                    ┌───────────────┐   ┌──────────────────────────────┐
                    │ PostgreSQL    │   │ Redis (leaderboards, queues) │
                    │ Neon/Supabase │   │ Stripe (billing)             │
                    └───────────────┘   │ S3 (uploads)                 │
                                        │ AI tutor (LLM API)           │
                                        └──────────────────────────────┘

  Phase B (hosted machines) - a SEPARATE Node service, not on Vercel:

                    ┌──────────────────────────────────────────┐
   Next.js  ──HTTP─▶│ Orchestrator (VPS/cloud VM)              │
   (enqueue)        │  - Docker: per-user isolated networks    │
                    │  - WireGuard: per-user VPN peers         │
                    │  - spawn / extend / reap (TTL)           │
                    └──────────────────────────────────────────┘
        User ──WireGuard VPN──▶ their own isolated target container
```

The core app (Phases 1-7) is fully serverless-friendly and runs on Vercel +
managed Postgres. Only Phase B needs a long-lived host, because it manages
Docker and kernel WireGuard, which serverless cannot do.

## Data model

The full schema is in `prisma/schema.prisma`, designed up front across all
phases so later work adds behavior, not migrations. Groups:

- **Auth:** `User`, `Account`, `Session`, `VerificationToken`, `Profile`.
  Roles: `USER < CREATOR < ADMIN`.
- **Academy:** `Module`, `Lesson`, `Path`, `PathItem`. Prose lives in MDX
  (`Lesson.contentRef`), not the DB. `LessonProgress` / `PathProgress` track
  per-user state.
- **Practice:** `Machine`, `Flag`, `Hint`, `MachineTask`, plus per-user
  `MachineProgress`, `MachineTaskCompletion`, `HintUnlock`, `FlagSubmission`.
- **Gamification:** points/rank/streak cache on `User`; `Achievement` +
  `UserAchievement`.
- **Community:** `Writeup`, `Comment`, `ForumThread`, `ForumPost`, `Vote`,
  `Team`, `TeamMember`, `MentorMatch`.
- **CTF:** `Competition`, `CompetitionChallenge`, `CompetitionParticipant`,
  `CompetitionSolve`.
- **Business/ops:** `Subscription`, `Notification`, `AuditLog`.
- **Phase B:** `MachineInstance`, `VpnPeer`.

Denormalized counters (`points`, `ownsCount`, `upvoteCount`, ...) are advisory
caches; the join tables are the source of truth.

## Key decisions

### Content as data (MDX -> DB)

Lesson/machine prose lives in `content/**.mdx`. Frontmatter is authoritative and
the seed upserts DB rows from it. The DB holds structure + progress + FKs, not
prose. Adding content is "write MDX, reseed" with no code changes. Interactive
lessons work because MDX is compiled server-side (`next-mdx-remote/rsc`) with a
map of client components (Quiz, SubnetCalculator, ...) that hydrate on the
client and persist state through a React context wired to server actions.

**Tradeoff:** content ships in the repo/build rather than a CMS. Great for a
solo author + versioned content; a creator marketplace (Phase 5) will also store
submitted content in the DB and render it the same way.

### Auth.js dual instance (edge + node)

`auth.config.ts` is edge-safe (no Prisma/bcrypt) and powers `middleware.ts` for
route protection via JWT. `auth.ts` adds the Prisma adapter + Credentials
(bcrypt) + OAuth and runs in the Node runtime. Sessions are **JWT** (required by
the Credentials provider); the adapter still persists OAuth users.

**Tradeoff:** JWT sessions cannot be revoked server-side instantly. Acceptable
here; a future switch to DB sessions for OAuth-only users is a config change.

### Flag validation + anti-cheat

Flags are stored as `SHA-256(canonicalized flag)` only, never plaintext. The
submit server action hashes input server-side and compares. It records every
submission (`FlagSubmission`) with `ip`, `userAgent`, and the submitted hash, so
identical-submission (flag-sharing) patterns are queryable. Rate limiting is a
DB count today; it moves to Redis in Phase 4. First blood is the first ROOT
capture on a machine. For hosted machines (Phase B), flags can be
`perUserSalted` so a shared flag fails for everyone but the owner.

### Feature gating

`lib/env.ts` exposes booleans (Stripe, Redis, S3, AI tutor, orchestrator) that
default off when env is absent, so the app runs with only `DATABASE_URL` +
`AUTH_SECRET`. Each later phase turns on when its env is set. The admin panel
shows the live flags.

## The 8-phase plan

Phase 1 is done and running. Each phase is a working milestone.

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation: Next + Prisma + Postgres + Auth.js, full schema, dark UI, dashboard, one seeded lesson end to end | Done |
| 2 | Academy: MDX lessons + interactive components + paths + progress | Core done; expand content breadth |
| 3 | Practice (Phase A targets): catalog, machine pages, Docker + BYO-VM, flags, hints, writeups | Core done (flags/hints/tasks/walkthrough live); expand machines |
| 4 | Gamification: points, ranks, Redis leaderboards + realtime, badges, streaks, rich profiles (skill radar, heatmap) | Points/ranks/streaks live; leaderboard basic; Redis + radar/heatmap next |
| 5 | Community: forums, spoiler-locked public writeups, teams, activity feed, creator submission flow | Schema in place; UI next |
| 6 | SaaS: Stripe subscriptions + tiers + admin dashboard + moderation | Admin basic; billing next |
| 7 | Differentiators: AI tutor (Socratic hints), adaptive paths, CTF events | Schema in place; build next |
| 8 | Phase B: hosted machines - orchestration + WireGuard VPN + isolation + spawn/extend/reap + anti-abuse | Schema in place; separate service |

### Phase B cost + scaling notes (the hard, expensive part)

Hosted machines are the defining HTB/THM feature and the real cost center.

- **Isolation model:** one Docker network per active user, one target container
  attached, plus a WireGuard peer whose allowed-IPs is just that network. Users
  reach only their own target, never each other or the host. Enforce with
  per-network firewall rules and dropped inter-network forwarding.
- **Lifecycle:** `MachineInstance` rows drive a queue (BullMQ). Spawn provisions
  network + container + WG peer and returns a target IP + client config. A TTL
  reaper terminates idle/expired instances. Extend bumps `expiresAt`.
- **Cost:** every running instance is real RAM/CPU. A small box is ~256-512 MB.
  A single 8 GB VM holds only ~10-20 concurrent instances. This is why hosted
  machines are a **paid (Pro)** feature with concurrency caps per tier, idle
  timeouts, and aggressive reaping. Budget by peak concurrency, not signups.
- **Anti-abuse:** cap concurrent instances per user, rate-limit spawns, block
  outbound from target networks except to the intended target, watch for
  crypto-miner egress patterns, and audit-log everything.
- **Portability:** the controller is an interface (`spawn/extend/terminate`), so
  Docker today can become Kubernetes/Nomad/Firecracker later without touching
  the app.

Because of this cost curve, Phases A targets (Docker on the user's own machine,
bring-your-own VulnHub VM) ship first and remain free forever; hosted is the
premium layer added last.
