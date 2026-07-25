# Contributing to Make or Break

Thanks for your interest in helping. Make or Break is a free, open-source platform
for learning technology by doing, and contributions of all sizes are welcome:
fixing a typo in a lesson, adding a new lesson or challenge, improving a component,
or filing a clear bug report.

## Ways to contribute

- **Content**: lessons, challenges, machines, and glossary terms live under
  `content/` as MDX. New teaching material is the most valuable contribution.
- **Code**: features, fixes, accessibility, and performance improvements to the
  Next.js app under `app/`, `components/`, and `lib/`.
- **Bugs and ideas**: open an issue describing what you saw and what you expected.

## Local setup

Requirements: Node 20+ and a Postgres database (a free Supabase or Neon project,
or local Postgres).

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL / DIRECT_URL and AUTH_SECRET
npm run db:seed           # load the MDX content into the database
npm run dev               # http://localhost:3000
```

No account is needed to use the app locally: it runs in guest mode by default,
and every account has the same permissions (accounts exist only to save progress).

## Writing lessons

Lesson content follows a strict house style so the whole corpus reads as one
voice. Read `WRITING_GUIDELINES.md` first, then check your work:

```bash
npm run check:content     # lints the corpus against the writing contract
npm run typecheck         # tsc --noEmit
```

A lesson is an MDX file with frontmatter (title, module, order, summary,
objectives, prerequisites) and a body. Each lesson has exactly three `<Quiz>`
blocks, defines its terms in plain language, and builds on its prerequisites.
Two house rules the linter enforces: no em-dashes or en-dashes, and no emojis
(use words or icons).

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Make focused changes with a clear commit message.
3. Run `npm run typecheck` and, for content, `npm run check:content`.
4. Open a pull request describing the change and how you verified it.

Small, well-scoped pull requests are the easiest to review and merge. If you are
planning something large, open an issue first so we can align on the approach.

## Code of conduct

Be kind and constructive. This is a learning community; assume good faith, help
newcomers, and keep discussion focused on the work.
