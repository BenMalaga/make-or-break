# Make or Break

A free, open-source platform for learning how technology works by doing: the
Academy (lessons, paths, certifications, challenges), hands-on vulnerable
machines, an in-browser IDE, and gamification. Two tracks: Make (build it) and
Break (take it apart).

**No accounts. No signup. No database.** Content is MDX on disk and your
progress (completed lessons, notes, solves, points, streak, badges) saves itself
in your browser's localStorage from the first click. Self-host it anywhere Node
runs. See [DEPLOY.md](./DEPLOY.md) to put it online, and
[ARCHITECTURE.md](./ARCHITECTURE.md) for the design.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind** + shadcn/ui + Framer Motion
- **MDX** content pipeline for lessons and machines (with interactive React components)
- **Zustand** + localStorage for progress (no server-side state anywhere)
- Catppuccin theme (Mocha dark default, Latte light)

## Quickstart

Prerequisites: Node 18+.

```bash
# 1. Install
npm install

# 2. Configure env (only the public app name/url are needed)
cp .env.example .env

# 3. Run
npm run dev
```

Open http://localhost:3000. There is no step 4: nothing to migrate, nothing to seed.

### Progress and privacy

Everything the learner does lives in their own browser under the
`mob.progress.v1` localStorage key. Nothing is sent to a server. The Settings
page exports it as JSON. Clearing browser data clears progress; there is no
other copy.

## Scripts

| Script | What |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:content` | Lint the lesson corpus against the writing contract |
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
  layout/ machines/ gamification/ ...
content/
  lessons/<module>/*.mdx MDX lessons (frontmatter is the source of truth)
  machines/*.mdx         machine defs (+ *.walkthrough.mdx, spoiler-gated)
  paths/*.mdx            ordered lesson+machine paths
lib/
  progress/store.ts      the client-side progress store (localStorage)
  content/               MDX loaders + on-disk catalog + RSC renderer
  gamification/          ranks, points, streak, achievements (pure functions)
  actions/               server actions that only read content (flags, hints,
                         exams, daily) - answers never ship to the client
  flags.ts               SHA-256 flag hashing
```

## Content is data: how to add things

Content lives in `content/**.mdx`. Frontmatter is authoritative and is read
directly from disk at render time: to add content you write MDX and deploy. No
seeding step exists. Copy an existing file as a template.

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
