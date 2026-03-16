# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevRacing is a monorepo containing **TechPulse MX**, a Spanish-language AI-generated tech newsletter. The app uses Gemini AI to generate personalized newsletter content across 5 selectable topics (AI, Frontend, Backend, Startups, Dev Tips), then sends each subscriber a customized email with only their chosen sections.

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

Deploy (not connected to GitHub, manual deploy):
```bash
cd newsletter && npx vercel --prod
```

## Architecture

- **Framework**: Next.js 16 (App Router) with TypeScript, Tailwind CSS v4
- **Database**: PostgreSQL (Neon serverless) via Prisma ORM
- **AI**: Google Gemini 2.5 Flash (`@google/genai`) for newsletter content generation
- **Email**: Nodemailer with SMTP (DreamHost)
- **Hosting**: Vercel with 2 cron jobs (daily 12 UTC, weekly Monday 12 UTC), 120s max timeout

### Key directories and files

- `newsletter/src/lib/topics.ts` — 5 topic definitions (techAI, frontend, backend, startups, devTips) with validation helpers
- `newsletter/src/lib/gemini.ts` — Gemini AI integration; generates 5 sections as independent HTML fragments per call, plus `buildEmailShell()` for header/footer template
- `newsletter/src/lib/mailer.ts` — Email sending: `assembleEmailHtml()` filters sections by subscriber topics, `sendBulkEmails()` sends personalized emails
- `newsletter/src/lib/news-ingester.ts` — RSS feed ingestion for 5 categories (techAI, devTools, frontend, backend, startups)
- `newsletter/src/lib/cron-helpers.ts` — `runDailyCron()` and `runWeeklyCron()` orchestrate the full pipeline: ingest → generate → save → send
- `newsletter/src/lib/prisma.ts` — Singleton Prisma client
- `newsletter/prisma/schema.prisma` — Two models: `Subscriber` (with topics, customPrompt, double opt-in) and `Newsletter` (with sections JSON)

### Newsletter Generation Flow

1. **Ingest**: RSS feeds fetched in parallel for 5 categories (~5s)
2. **Generate**: Single Gemini call produces 5 section fragments as structured JSON (~15-20s)
3. **Images**: AI images generated via Pollinations API, pre-warmed in parallel (~10s)
4. **Save**: Newsletter stored with `sections` JSON + assembled `htmlContent` for preview
5. **Send**: Per subscriber, `assembleEmailHtml()` filters sections to their chosen topics, personalizes unsubscribe/preferences URLs, sends via SMTP with 500ms delay

### API Routes

All under `newsletter/src/app/api/`:

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/subscribe` | POST | Public | Subscribe with email, topics, and optional customPrompt |
| `/api/confirm` | GET | Token param | Double opt-in email confirmation |
| `/api/unsubscribe` | GET | Token param | Deactivates subscriber |
| `/api/preferences` | GET/POST | Token param | Get/update subscriber preferences (topics, frequency, customPrompt) |
| `/api/generate` | POST | CRON_SECRET | Generates newsletter via Gemini (5 sections), saves to DB |
| `/api/send` | POST | CRON_SECRET | Sends latest unsent newsletter with per-subscriber topic filtering |
| `/api/cron` | GET | CRON_SECRET | Legacy: combined generate + send (calls daily cron) |
| `/api/cron/daily` | GET | CRON_SECRET | Daily cron: ingest + generate + send to daily subscribers |
| `/api/cron/weekly` | GET | CRON_SECRET | Weekly cron: compile digest from dailies + send to weekly subscribers |
| `/api/newsletter/latest` | GET | Public | Returns most recent newsletter for homepage preview |
| `/api/newsletter/recent` | GET | Public | Returns 5 most recent sent newsletters |
| `/api/newsletter/history` | GET | CRON_SECRET | Paginated newsletter history |
| `/api/stats` | GET | Public | Returns subscriber count and newsletter count |

Protected routes use `Authorization: Bearer ${CRON_SECRET}` header.

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page with topic picker subscription form and newsletter preview |
| `/preferences?token=xxx` | Token-based preferences page to change topics, frequency, custom prompt |

### Environment Variables

Required in `.env`: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `GEMINI_API_KEY`, `CRON_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`

## Conventions

- UI text and newsletter content are in **Spanish**
- The homepage (`page.tsx`) is a client component that fetches the latest newsletter for preview
- Newsletter section HTML uses **inline styles only** (email client compatibility)
- Gemini generates sections as independent `<div>` fragments; `buildEmailShell()` wraps them in header/footer
- Bulk email sending includes a 500ms delay between recipients
- `{{unsubscribe_url}}` and `{{preferences_url}}` placeholders get replaced per-subscriber at send time
- Subscriber topics stored as JSON string in DB (e.g., `["techAI","frontend","devTips"]`)
- Default topics for new/existing subscribers: `["techAI","devTips","startups"]` (the original 3 sections)
- `customPrompt` field is stored but not yet used in generation (reserved for v2)
