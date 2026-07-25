# Make or Break

A multi-tenant platform for learning offensive security by doing: structured
courses (the Academy) plus hands-on vulnerable machines (the Practice platform),
with gamification, community, and a path to hosted, VPN-reachable targets.

**Free and open source (MIT).** No signup required to start: a guest session
tracks your progress from the first click, and creating an account is optional
(it just lets you keep your progress across devices). Self-host it anywhere
Postgres runs. See [DEPLOY.md](./DEPLOY.md) to put it online, and
[ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind** + shadcn/ui + Framer Motion
- **PostgreSQL** via **Prisma** (typed schema + migrations)
- **Auth.js v5** (NextAuth) - credentials (email/username + password) and optional GitHub/Google OAuth, role-based (user / creator / admin)
- **MDX** content pipeline for lessons and machines (with interactive React components)
- Catppuccin theme (Mocha dark default, Latte light)

Later phases layer in Redis (leaderboards/queues), Stripe (subscriptions), S3
(uploads), an AI tutor, and a Docker + WireGuard orchestration service for
hosted machines. All of those are feature-gated and off until their env is set,
so the app runs end to end with only a database.

## Quickstart

Prerequisites: Node 18+ and a PostgreSQL database.

```bash
# 1. Install
npm install

# 2. Configure env (only DATABASE_URL + AUTH_SECRET are required)
cp .env.example .env
#   - set DATABASE_URL to your Postgres
#   - AUTH_SECRET: openssl rand -base64 32

# 3. Create the schema + generate the client
npm run db:migrate

# 4. Seed content (reads content/**.mdx into the DB)
npm run db:seed

# 5. Run
npm run dev
```

Open http://localhost:3000.

### Accounts

No account is required. The app runs in guest mode by default and still saves your
progress. Registering (or signing in) just persists that progress across devices.
Every account has the same permissions; accounts exist only to save progress.

## Scripts

| Script | What |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:migrate` | Create/apply a Prisma migration (dev) |
| `npm run db:seed` | Load `content/**` MDX into the DB (idempotent) |
| `npm run db:reset` | Drop, re-migrate, re-seed |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Project structure

```
app/                     App Router routes
  (auth)/                login, register (centered layout)
  (app)/                 authenticated app (sidebar + header shell)
    dashboard, learn, machines, paths, leaderboard, writeups, settings, u/[username], admin
  api/                   auth handler, data export
  page.tsx               public landing
auth.ts / auth.config.ts Auth.js (node instance / edge-safe config for middleware)
middleware.ts            route protection (edge)
components/
  ui/                    shadcn primitives
  mdx/                   interactive MDX components (CommandCard, Quiz, Callout, ...)
  diagrams/              interactive diagrams (SubnetCalculator, OsiModel, ...)
  layout/ machines/ gamification/ auth/ ...
content/
  lessons/<module>/*.mdx MDX lessons (frontmatter is the source of truth)
  machines/*.mdx         machine defs (+ *.walkthrough.mdx, spoiler-gated)
  paths/*.mdx            ordered lesson+machine paths
lib/
  db.ts                  Prisma singleton
  content/               MDX loader + RSC renderer + lesson interactivity context
  gamification/          ranks, points, streak, achievements
  actions/               server actions (progress, flags, auth)
  flags.ts               SHA-256 flag hashing
prisma/schema.prisma     the full data model (all phases)
prisma/seed.ts           MDX -> DB
```

## Content is data: how to add things

Content lives in `content/**.mdx`. Frontmatter is authoritative; the seed reads
it and upserts DB rows. To add content you write MDX and run `npm run db:seed`.
You never hand-write DB rows. Copy an existing file as a template.

Note on YAML frontmatter: avoid a bare colon-space (`: `) inside an unquoted
value, or wrap the value in quotes (js-yaml reads `foo: bar` as a nested map).

### Add a lesson

1. Create `content/lessons/<module-slug>/<lesson-slug>.mdx`:

```mdx
---
title: My Lesson
module: networking-foundations        # module slug (created if new)
moduleTitle: Networking Foundations    # used when creating the module
moduleOrder: 1
moduleIcon: Network                    # a LucideIcon name
order: 5                               # position within the module
summary: One-line hook.
estimatedMinutes: 15
objectives:
  - What the learner will be able to do
tags: [networking]
---

Markdown plus interactive components:

<CommandCard command="nmap -sVC $IP" explain="Service + default scripts." />
<Quiz id="q1" question="..." answer={1} options={["a","b"]} explanation="..." />
<Diagram type="subnet" />
<Notes />
```

2. `npm run db:seed`. Available MDX components: `CommandCard`, `CommandBlock`,
   `ExpectedOutput`, `Callout`, `Quiz`, `Exercise`, `Notes`, `Diagram`.

### Add a machine

1. Create `content/machines/<slug>.mdx` (frontmatter defines target, flags,
   hints, tasks) and optionally `content/machines/<slug>.walkthrough.mdx`
   (spoiler-gated: only served after the user roots the box or it retires).
2. Flags are authored as plaintext `value:` and hashed to SHA-256 at seed
   (plaintext is never stored in the DB). `targetType` is `DOCKER`, `BYO_VM`,
   or `HOSTED`. See `content/machines/juice-shop.mdx` for a Docker example and
   `basic-pentesting.mdx` for a bring-your-own-VM example.
3. `npm run db:seed`.

### Add a path

Create `content/paths/<slug>.mdx` with an ordered `items:` list referencing
lesson and machine slugs, then reseed. See `content/paths/network-recon-path.mdx`.

### Add a badge / rank

Edit `lib/gamification/achievements.ts` (badges) or `lib/gamification/ranks.ts`
(rank ladder), then reseed for badges.

## Deploy

- **Frontend + API:** Vercel (zero-config). Set the env vars from `.env.example`.
- **Database:** Neon or Supabase Postgres. Run `prisma migrate deploy` in the
  build, then seed once.
- Later phases (Redis, Stripe, S3, orchestrator) are documented in
  [ARCHITECTURE.md](./ARCHITECTURE.md).

## Ethics

Every machine is one you run yourself or are authorized to attack. New users
accept the [rules of engagement](/rules) at signup. This is a tool for learning
defense and doing authorized testing, nothing else.
