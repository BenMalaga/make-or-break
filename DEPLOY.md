# Deploying Make or Break

The app is a standard Next.js 14 app plus a Postgres database. It deploys to
Vercel in a few minutes. The only thing you have to provide is a database and
two environment variables.

## 1. Get a free Postgres

Any Postgres works. The easiest free options:

- **Neon** (recommended): create a project at neon.tech, copy the connection
  string. Free tier is plenty to start.
- **Vercel Postgres / Supabase**: also fine. Copy the connection string.

You want a URL that looks like:
`postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require`

## 2. Import the repo to Vercel

1. Push this repo to GitHub (already done if you are reading this there).
2. In Vercel, "Add New Project" and import the repo.
3. Framework preset: Next.js (auto-detected). Leave the build command as is:
   Vercel runs the `vercel-build` script, which applies migrations, seeds the
   content, and builds.

## 3. Set environment variables

In the Vercel project settings, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | your Postgres connection string from step 1 |
| `AUTH_SECRET` | generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | your deployed URL, e.g. `https://makeorbreak.vercel.app` |

Optional (features stay off until set): `AUTH_GITHUB_ID/SECRET`,
`AUTH_GOOGLE_ID/SECRET` for OAuth. See `.env.example` for the full list.

## 4. Deploy

Hit Deploy. On each deploy the `vercel-build` script runs
`prisma migrate deploy` (applies the schema), `prisma db seed` (loads every
lesson, machine, cert, and path from `content/`), then `next build`. So a push
that adds content is all it takes to publish it.

That's it. Visitors can start immediately as guests, no signup, with progress
tracked. Creating an account is optional and claims their guest progress.

## Notes on running it as a free, open platform

- **Guest accounts** create a DB row per anonymous visitor. To keep the DB
  small over time, periodically delete stale guests, for example guests with no
  activity older than 30 days (`isGuest = true` and no recent progress).
- **Content updates** ship on deploy, since the seed re-reads `content/` every
  build.
- Costs are the database and Vercel bandwidth. A hobby setup is free; a busy
  public instance is cheap and can be covered by donations or a single banner.
