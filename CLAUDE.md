# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Strategic / Chess thinking — MANDATORY before every change

Before writing any code, run this mental model:

1. **What piece am I moving?** Name the exact file/table/hook being changed.
2. **What depends on it?** Callers, subscribers, consumers, the other app (Dr. Bloom ↔ ChildBloom), RLS, realtime publications, FK constraints.
3. **What breaks if I change it?** Second-order effects — env vars, UI state, migration order, other consumers of the same table.
4. **What do I need to fix alongside it?** Never ship a half-move. Fix every downstream break in the same commit.

This project is a two-app closed ecosystem. A change in ChildBloom DB schema or realtime config immediately affects Dr. Bloom's API, and vice versa. Always trace both directions.

## Commands

```bash
# From repo root — run both frontend and backend together
npm run dev

# Individual services
npm run dev:client   # Vite on http://localhost:5173
npm run dev:server   # Express on http://localhost:3001

# Build for production
npm run build

# From client/ — Lighthouse PWA audit (requires dev server running)
npm run lighthouse
```

There is no test suite. No linter is configured at the root level.

## Architecture

This is a **full-stack child development companion app** with three distinct execution environments:

```
Code Base/
├── client/          # React 19 + Vite SPA (deployed as Vercel static)
├── server/          # Express.js (local dev only; Vercel replaces this in prod)
├── api/             # Vercel serverless functions (the production backend)
└── supabase/        # SQL migrations — run manually in Supabase SQL Editor
```

**In production**, only `client/` and `api/` are used. The Express `server/` is a local dev convenience and is superseded by Vercel functions for deployment.

### Client (`client/src/`)

Feature-based structure — each domain lives in `features/<name>/`:

- `auth/` — sign-in/sign-up, Google OAuth callback
- `dashboard/` — main home screen (demo mode for guests, live for authed users)
- `ask/` — Dr. Bloom AI chat with SSE streaming
- `onboarding/` — new user flow
- `weekly-update/` — 6-step parent/child check-in form
- `growth/`, `food/`, `health/`, `guides/`, `settings/`

Shared code in `components/layout/`, `components/ui/`, `components/shared/`, `hooks/`, `stores/`, `lib/`.

### Routing (`client/src/App.jsx`)

React Router v7 with explicit `<Routes>`. All routes are **lazy-loaded**. `/` redirects to `/dashboard`.

- `/dashboard` is **public** — renders a demo mode for unauthenticated visitors
- All `/child/:id/*`, `/ask`, `/guides`, `/settings` routes are wrapped in `<ProtectedRoute>`
- `<ProtectedRoute>` redirects to `/` if no session; redirects to `/onboarding` if `profile.onboarding_complete` is false

### State Management

Three Zustand stores in `stores/`:

| Store | Holds |
|---|---|
| `authStore` | `session`, `user`, `profile`, `isLoading` |
| `childStore` | `selectedChildId`, `children[]` |
| `uiStore` | `sidebarOpen`, `toasts[]` |

**React Query** (TanStack v5) handles all server state with `staleTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`. Query keys follow `['resource-name', id]` patterns. Direct Supabase calls go inside `queryFn`; mutations call `queryClient.invalidateQueries` to refresh.

When a user signs out (`useAuth.signOut()`), both `authStore` and `childStore` must be cleared — `childStore` is not wiped automatically by Supabase auth events.

### Data Layer

- **`lib/supabase.js`** — Supabase client using `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. RLS enforces row ownership on all tables.
- **`lib/api.js`** — Axios instance pointing to the Express server (dev) or `/api` (prod), auto-attaches Bearer token from `localStorage('sb-access-token')`.
- **`hooks/useAuth.js`** — Wraps Supabase auth events; syncs session into `authStore`; fetches `profiles` row on login.
- **`hooks/useChild.js`** — `useChildren()` fetches children for current user and seeds `childStore`. `useSelectedChild()` reads from the store.

### Serverless API (`api/`)

All handlers export `default async function handler(req, res)` (Vercel format).

| File | Purpose |
|---|---|
| `api/ai/ask.js` | Dr. Bloom AI — authenticates JWT, fetches child context from Supabase, streams Claude response via SSE |
| `api/ai/weekly-insight.js` | Generates AI summary after weekly check-in |
| `api/lib/drBloomPrompt.js` | System prompt builder, intent classifier, emergency keyword detector (EN/HI/ML/TA) |
| `api/tts.js` | Text-to-speech (Google Cloud TTS → browser SpeechSynthesis fallback) |
| `api/send-review.js` | Forwards app reviews to `childbloomenterprise@gmail.com` via Resend API |
| `api/scan-bill.js` | Medical bill OCR analysis |

Dr. Bloom streaming uses SSE: the client connects with `fetch` + `ReadableStream` parsing, not `EventSource`. The handler writes `data: {...}\n\n` chunks and closes with `data: [DONE]\n\n`.

### Styling

Tailwind CSS with custom tokens defined in `client/tailwind.config.js`:

- **Colors**: `forest-*` (greens, primary brand), `cream-*` (backgrounds), `terracotta-*` (accents), `ios.*` (iOS-style pastels)
- **Fonts**: `Inter` (sans), `Fraunces` (serif/display)
- **Shadows**: `glass`, `glass-sm`, `glass-lg` for frosted panels; `card`, `card-hover` for elevation
- **Gradients**: `app-bg` (page background), `glass-card`, `btn-primary`

Avoid using shadcn CSS variable tokens (`--background`, `--foreground`, etc.) — this project uses its own named tokens. Prefer inline styles for one-off colors not in the config.

Global animations (splash screen, fade-in, etc.) live in `client/src/index.css`.

### Internationalisation

`i18next` with 6 languages: English, Hindi, Malayalam, Tamil, Telugu, Punjabi. Translation files are in `client/src/i18n/`. Use `useTranslation()` hook; fallback language is English.

### Analytics (PostHog)

Client analytics is a **bundled module**, not the old inline `<script>` snippet.
The strict CSP (`script-src 'self' …`, no `unsafe-inline`) silently blocked the
inline snippet in production — for months **zero events were captured**. The fix:

- **`client/src/lib/analytics.js`** — imports `posthog-js`, exposes `initAnalytics()`,
  `track(event, props)`, `identifyUser(userId, email)`, `resetAnalytics()`, `capturePageview(path)`.
  Ships inside our bundle (served from `'self'`) so it runs under the CSP.
- **`main.jsx`** calls `initAnalytics()` before React mounts.
- **`App.jsx`** `<PageviewTracker/>` fires a `$pageview` on every SPA route change
  (`capture_pageview` is disabled in init so navigations are counted exactly once).
- **`useAuth.js`** identifies the user on login/session-restore and `resetAnalytics()` on sign-out.
- Disabled cleanly when `VITE_POSTHOG_KEY` is absent (local dev) — never breaks the app.

**CSP requirement** (already in `vercel.json`): `script-src` and `connect-src` must
include `https://us.i.posthog.com` and `https://us-assets.i.posthog.com`, plus
`worker-src 'self' blob:` for session replay. If you tighten the CSP, keep these or
analytics dies silently again.

Events currently fired: `sign_up`, `child_added`, `dr_bloom_message_sent`,
`premium_wall_hit`, `premium_page_viewed`, plus `$pageview`/`$pageleave`/autocapture.
Server-side events use `posthog-node` (`api/lib/posthog.js`). Tests: `npm test` (vitest)
in `client/` — see `src/lib/analytics.test.js`.

### Database Migrations

SQL files live in `supabase/migrations/` but **are not auto-applied**. Run them manually in the Supabase SQL Editor at https://supabase.com/dashboard/project/qkjwmcmdevtbvcanamjg/sql. Alternatively use the Supabase MCP tool (`mcp__claude_ai_Supabase__apply_migration`, project ID `qkjwmcmdevtbvcanamjg`).

### Environment Variables

**`client/.env`** (Vite — must be prefixed `VITE_`):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_POSTHOG_KEY        # PostHog project token (phc_…) — public/write-only, safe to ship
VITE_POSTHOG_HOST       # optional — defaults to https://us.i.posthog.com
```

**`server/.env`** / Vercel dashboard:
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
ANTHROPIC_MODEL         # optional — overrides default `claude-sonnet-4-6`
RESEND_API_KEY          # for review emails
REVIEW_EMAIL            # optional — overrides default childbloomenterprise@gmail.com
REVIEW_FROM             # optional — overrides default Resend "from" address
GOOGLE_TTS_API_KEY      # optional — enables high-quality multilingual TTS
FRONTEND_ORIGIN         # production CORS allowlist (e.g. https://childbloom.app)
```

### Vercel routing gotcha

`vercel.json` ends with a catch-all `(.*) → /index.html` rewrite for the SPA. Vercel resolves `/api/*` against serverless functions *before* the rewrite layer, so this is safe — but new API handlers only work once they exist as files in `api/`. A typo in a fetch URL falls through the rewrite and silently returns the SPA shell rather than a 404.
