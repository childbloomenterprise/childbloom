# ChildBloom — Launch Status
**Branch:** `launch-v1`
**Date:** 2026-05-22
**Status:** PRE-LAUNCH FREEZE ACTIVE

---

## FEATURE FREEZE IN EFFECT
> No new features after 2026-05-22 unless tagged `[LAUNCH-BLOCKER]`.
> Allowed: bug fixes, deployment tasks, launch blockers only.

---

## WHAT WORKS

### Auth & Onboarding
- [x] Google OAuth login (Supabase Auth + callback)
- [x] Onboarding flow — new user profile creation
- [x] Protected routes (ProtectedRoute guard)
- [x] Session persistence (Zustand authStore + Supabase SDK auto-refresh)

### Core Features
- [x] Dashboard — home screen with child summary, demo mode for guests
- [x] Weekly check-in — 6-step form (feeding, measurements, mood, sleep, etc.)
- [x] Dr. Bloom AI chat — SSE streaming, multi-turn, intent classification
- [x] Growth charts — WHO growth curves, percentile display (height/weight by gender)
- [x] Sleep chart — duration and quality logging
- [x] Food tracker — nutritional database with search
- [x] Vaccination tracker — IAP schedule, upcoming reminders, CRUD
- [x] Health records — medical history logging
- [x] Bloom Path — developmental area tracking (milestones by age)
- [x] Achievements — milestone badge system
- [x] Family profiles — multi-child support, avatar, edit, PDF export
- [x] Emergency first-aid guide — offline, animated, multi-topic
- [x] CPR Rhythm Coach — fully offline, no DB dependency
- [x] Guides — stage-based parenting content
- [x] Weekly report — AI-generated insight summary
- [x] Settings — theme (night dim), preferences
- [x] Help page — FAQ + contact form (sends to childbloomenterprise@gmail.com via Resend)
- [x] Privacy page
- [x] Landing page

### Backend / API
- [x] Vercel serverless functions (production backend)
- [x] Rate limiting — 3/min, 30/hr, 100/day on AI endpoints
- [x] Input sanitization and UUID validation
- [x] Supabase RLS on all tables
- [x] JWT verification middleware
- [x] Health check endpoint (`/api/health`)
- [x] Medical bill OCR (`/api/scan-bill`)
- [x] PDF report generation (`/api/generate-summary`)
- [x] Observation dashboard (`/api/insights/observation`)
- [x] App feedback submission (`/api/send-review`)

### Infrastructure
- [x] Vercel deployment (static frontend + serverless API)
- [x] Supabase PostgreSQL with 10+ migrations
- [x] i18n — 6 languages (EN, HI, ML, TA, TE, PA)
- [x] Offline support — emergency content works without internet
- [x] PWA — installable, update prompt
- [x] Capacitor shell (Android build scaffolding)
- [x] TTS — Google Cloud TTS with browser SpeechSynthesis fallback

---

## WHAT IS BROKEN / INCOMPLETE

### Payments / Premium
- [ ] **Premium tier is NOT active** — UI references premium features but no paywall, no subscription logic, no Stripe/Razorpay integration
- [ ] Premium screen exists in strategy doc only — not built as a real gate

### Automation Agents
- [ ] **Daily email digest** — removed with Twitter agent; re-evaluate if needed post-launch

### Testing
- [ ] **No test suite** — zero unit, integration, or e2e tests configured
- [ ] No CI/CD pipeline beyond Vercel auto-deploy on push

### Mobile
- [ ] **Android build not verified** — Capacitor config exists, Play Store setup docs exist, but build/signing not confirmed working
- [ ] No iOS build configured

### Minor
- [ ] Google Cloud TTS key — optional, falls back to browser TTS; not configured = degraded voice quality
- [ ] No analytics / error monitoring (Sentry, Mixpanel, etc.) — crashes are silent

---

## WHAT IS DANGEROUS

### Highest Priority
- [ ] **No payment validation** — premium features are UI-only; users could access premium content without paying once the premium gate is built, if backend checks are missed
- [ ] **No backend Supabase rules audit** — RLS is configured but has not been pen-tested; verify all tables reject unauthorized reads/writes with a real non-auth session

### Medium Priority
- [ ] **Service role key scope** — `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS; confirm it is ONLY used in server-side API functions, never exposed to client
- [ ] **No rate limiting on non-AI endpoints** — `/api/scan-bill`, `/api/generate-summary`, `/api/send-review` have no rate limits; could be abused
- [ ] **No input validation on PDF/OCR endpoints** — file size limits and type checks not confirmed
- [ ] **No error monitoring** — unhandled exceptions and crashes are invisible post-launch

### Lower Priority
- [ ] **No account lockout / brute-force protection** — Supabase handles auth but review rate limits on login attempts
- [ ] **Email `childbloomenterprise@gmail.com` hardcoded in API** — if email changes, requires code deploy to update
- [ ] **No GDPR/data deletion audit** — migration `012_account_deletion.sql` exists but deletion flow not user-tested end-to-end

---

## LAUNCH BLOCKERS (must fix before ship)

| # | Issue | Severity |
|---|---|---|
| 1 | Set `CRON_SECRET` in Vercel env vars | HIGH |
| 2 | Add rate limiting to `/api/scan-bill` and `/api/generate-summary` | HIGH |
| 3 | Audit Supabase RLS with unauthenticated test session | HIGH |
| 4 | Verify account deletion works end-to-end | MEDIUM |
| 5 | Confirm Vercel environment variables are all set in production | MEDIUM |
| 6 | Test full auth flow (Google OAuth → onboarding → dashboard) on production URL | MEDIUM |

---

## DECISIONS

- **No new features.** Freeze is active as of 2026-05-22.
- **All PRs must be tagged** `[FIX]`, `[DEPLOY]`, or `[LAUNCH-BLOCKER]` to merge into `launch-v1`.
- **This document** is the source of truth for launch readiness. Update it as blockers are resolved.
