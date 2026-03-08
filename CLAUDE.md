# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevRacing is a monorepo containing **TechPulse MX**, a Spanish-language AI-generated tech newsletter. The app uses Gemini AI to generate newsletter content about tech/AI news, dev tips, and startup ecosystem updates (Mexico & Silicon Valley focus), then sends them via email to confirmed subscribers.

## Commands

All commands run from the `newsletter/` directory:

```bash
npm run dev          # Start Next.js dev server
npm run build        # Generate Prisma client + build Next.js
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema to database (no migration)
npm run db:migrate   # Create and apply Prisma migration
```

Standalone script for generating a newsletter with real curated news:
```bash
node newsletter/scripts/generate-real.js
```

## Architecture

- **Framework**: Next.js 16 (App Router) with TypeScript, Tailwind CSS v4
- **Database**: PostgreSQL (Neon serverless) via Prisma ORM
- **AI**: Google Gemini 2.5 Flash (`@google/genai`) for newsletter content generation
- **Email**: Nodemailer with SMTP (DreamHost)

### Key directories and files

- `newsletter/src/lib/gemini.ts` — Gemini AI integration; contains the full prompt for generating newsletters (subject, plain text, styled HTML)
- `newsletter/src/lib/mailer.ts` — Email sending: individual emails, confirmation emails, and bulk sending with per-subscriber unsubscribe URL personalization
- `newsletter/src/lib/prisma.ts` — Singleton Prisma client
- `newsletter/prisma/schema.prisma` — Two models: `Subscriber` (with double opt-in via `confirmed`/`token`) and `Newsletter`

### API Routes

All under `newsletter/src/app/api/`:

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/subscribe` | POST | Public | Subscribe with email (creates subscriber, sends confirmation email) |
| `/api/confirm` | GET | Token param | Double opt-in email confirmation |
| `/api/unsubscribe` | GET | Token param | Deactivates subscriber |
| `/api/generate` | POST | CRON_SECRET | Generates newsletter via Gemini, saves to DB (no sending) |
| `/api/send` | POST | CRON_SECRET | Sends latest unsent newsletter to all confirmed subscribers |
| `/api/cron` | GET | CRON_SECRET | Combined: generates + sends newsletter in one call |
| `/api/newsletter/latest` | GET | Public | Returns most recent newsletter for homepage preview |

Protected routes use `Authorization: Bearer ${CRON_SECRET}` header.

### Environment Variables

Required in `.env`: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `GEMINI_API_KEY`, `CRON_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`

## Conventions

- UI text and newsletter content are in **Spanish**
- The homepage (`page.tsx`) is a client component that fetches the latest newsletter for preview
- Newsletter HTML uses **inline styles only** (email client compatibility)
- Bulk email sending includes a 500ms delay between recipients
- The `{{unsubscribe_url}}` placeholder in generated HTML gets replaced per-subscriber at send time
