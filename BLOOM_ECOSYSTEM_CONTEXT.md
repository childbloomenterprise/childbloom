# Bloom — Ecosystem & Product Context

> Source of truth for building the Bloom Enterprise landing page / ecosystem site.
> Everything here is grounded in the actual codebase, not marketing fiction.

---

## 1. The one-line truth

**Bloom is a parenting intelligence company. Its first product is ChildBloom — a child
development companion for Indian parents (pregnancy → age 7). Dr. Bloom is the AI brain
that lives inside ChildBloom.**

There is currently **one app**, not two. "ChildBloom" is the product; "Dr. Bloom" is its
AI advisor feature. The ecosystem framing below is how to present them so the brand can
grow into more products later.

---

## 2. The brand

| Element | Value |
|---|---|
| Parent brand | **Bloom** (the enterprise / ecosystem) |
| Flagship product | **ChildBloom** (the app) |
| AI layer | **Dr. Bloom** (pediatric AI advisor inside ChildBloom) |
| Primary color | Forest green `#0F3D2E` (deep) / `#1D9E75` (bright/theme) |
| Accents | Terracotta `#D17A4F`, Gold `#C9A35A`, Soft green `#5FB48A` |
| Background | Warm cream `#F2F0EA` |
| Display font | Fraunces (italic serif — used for all headlines) |
| Body font | Inter / Inter Tight (sans) |
| Mono | JetBrains Mono (labels, stats) |
| Logo | A blooming-flower mark (6 petals + center seed) |
| Voice | Warm, literary, calm. Italic serif headlines. "Beautifully understood." |
| Tagline in use | "Every day with your baby, beautifully understood." |
| Trust line | "Free forever for the basics." |

---

## 3. The ecosystem map (how to present it)

```
                         BLOOM  (enterprise)
                            │
              ┌─────────────┴──────────────┐
              │                            │
        CHILDBLOOM                     DR. BLOOM
     (the product / app)        (the AI advisor, inside the app)
              │
   ┌──────────┼───────────┬──────────┬───────────┐
 Track      Understand   Care      Prepare     Grow
 (logging)  (insights)  (health)  (doctor)   (milestones)
```

- **Bloom** = the umbrella / company / future ecosystem.
- **ChildBloom** = what a parent installs and uses.
- **Dr. Bloom** = the reasoning layer they talk to inside ChildBloom.

For the landing page, present Dr. Bloom as a *named capability* ("Meet Dr. Bloom"),
not a separate download. This matches the in-app landing page that already exists.

---

## 4. ChildBloom — what it actually does (all built, in the codebase)

| Area | Feature | Detail |
|---|---|---|
| **Onboarding** | Pregnancy or child setup | Supports prenatal (due date) through age 7 |
| **Dashboard** | Daily home + "Bloom score" | Demo mode for guests, live for signed-in users |
| **Dr. Bloom chat** | AI advisor (`/ask`) | Streaming answers, knows the child's full profile |
| **Weekly check-in** | 6-step form | Measurements, mood, milestones, feeding, sleep, concerns → AI insight |
| **Growth** | Charts | Weight/height/head vs WHO standards; sleep chart |
| **Food tracker** | Indian food database | Ragi, dal, idli, Nendran banana, etc.; flags reactions |
| **Vaccination** | IAP 2023–24 schedule | Tracks given/upcoming/overdue doses |
| **Health records** | Medical history | Visits, diagnoses, doctor names |
| **Emergency** | First-aid module | CPR rhythm coach, choking, poisoning, burns, seizure — with animations |
| **Guides** | Developmental guides | Age-based how-tos |
| **Achievements** | Milestone celebrations | Gamified wins |
| **Bloom Garden** | Gamification | "Bloom moments" / garden visualization of growth |
| **Family** | Caregiver circle | Up to ~6 caregivers share one child |
| **Doctor PDF** | One-tap report | Growth + vaccines + check-ins + logs, formatted for pediatrician |
| **Languages** | 6 | English, Hindi, Malayalam, Tamil, Telugu, Punjabi |

---

## 5. Dr. Bloom — what makes the AI special (from `api/lib/drBloomPrompt.js`)

Dr. Bloom is **not a generic chatbot**. It is a pediatric reasoning engine:

- **Knows the specific child.** Every answer is built from a "Child Profile Folder" —
  exact age, birth profile, allergies, latest growth, last weekly check-in, recent food
  logs, health records, upcoming/overdue vaccines. It never gives generic advice when it
  has the child's data. Always uses the child's name.
- **Three modes, auto-detected:**
  - *Warm Friend* — empathy-first reassurance for a scared parent at 3am.
  - *Clinical Advisor* — structured, citation-backed prep for a doctor visit.
  - *Emergency Protocol* — hard-coded keyword detector that **bypasses the AI** and shows
    call-112 first-aid instantly (covers EN/HI/ML/TA, including "not breathing", "seizure",
    "choking", "fever 104").
- **Age-precision engine.** Talks in weeks for newborns, months for infants, years+months
  for toddlers — and adjusts developmental context per stage.
- **India-first medical knowledge.** IAP schedule over CDC; ragi as first food; extended
  breastfeeding; colostrum; oil massage (Shishu Abhyanga); no honey before 12 months;
  kajal warning. Evidence bases: WHO, AAP, IAP 2023–24, Erikson, Bowlby.
- **Safe by design.** Never diagnoses, never prescribes, never says "don't worry" without
  explaining why. Weaves the medical disclaimer naturally.
- Also powers **weekly insights** (3-paragraph summary after each check-in).

This is the strongest story for the landing page: *"Not a chatbot. A reasoning layer
that knows your baby."* (That line is already in the in-app landing page.)

---

## 6. Tech stack (for an "how it's built" / trust section)

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite SPA, Tailwind, i18next (6 languages) |
| Backend | Vercel serverless functions (`/api/*`) |
| AI | Anthropic Claude (Dr. Bloom + weekly insights), SSE streaming |
| Data | Supabase (Postgres + Auth + Row-Level Security) |
| Voice | Google Cloud TTS (multilingual) with browser fallback |
| Android | TWA (Trusted Web Activity) wrapping the live website |
| Hosting | Vercel — `https://childbloom-pi.vercel.app` |

**Key architectural fact for the ecosystem:** the Android app is a TWA. Any change pushed
to the website is instantly live in the app — no Play Store update needed. So a single
web codebase IS the app. This is what makes "ecosystem" scaling cheap: new Bloom surfaces
are just new web routes.

---

## 7. Current status (as of 2026-05)

- **Live web app:** `https://childbloom-pi.vercel.app`
- **Android:** versionCode 4 live on Google Play **closed testing (alpha)** track, India.
  Not yet public — completing Google's mandatory 20-tester / 14-day closed test, then
  production review.
- **Release automation:** one-command pipeline (`play_release.py`) exists.

---

## 8. What the ecosystem landing page should do

Goal: one front door at the Bloom level that lets a visitor understand the whole thing and
navigate in.

Recommended structure:
1. **Hero** — "Bloom. Parenting, beautifully understood." → primary CTA into ChildBloom.
2. **The ecosystem** — visual map: Bloom → ChildBloom (the app) + Dr. Bloom (the AI).
3. **ChildBloom** — the 5 pillars: Track · Understand · Care · Prepare · Grow.
4. **Meet Dr. Bloom** — the reasoning-layer story (modes, knows-your-baby, India-first).
5. **How it works** — log → Bloom learns rhythm → you understand everything (3 steps).
6. **Trust** — evidence bases, privacy/DPDPA, doctor-ready reports, 6 languages.
7. **CTA** — Get ChildBloom (web + Play Store closed test link for now).
8. **Footer** — Bloom enterprise, privacy, contact `childbloomenterprise@gmail.com`.

Reuse the existing visual system (forest green, Fraunces italic, flower mark) so the
ecosystem page and the in-app landing feel like one brand.

---

## 9. Honest gaps / decisions to make before building

- **Is "Bloom" a multi-product company yet?** Today it's one app. If the landing implies
  many products, decide what the *next* Bloom product is (e.g. a clinician portal, a
  pregnancy-only app) or keep it to "ChildBloom, powered by Dr. Bloom."
- **Domain.** Currently on `childbloom-pi.vercel.app`. An ecosystem brand wants a real
  domain (e.g. `bloom.health` / `childbloom.app`). Decide before launch.
- **Where does this page live?** Option A: a new `/` ecosystem page above the current app
  landing. Option B: a separate marketing site on the Bloom domain that links into the app.

---

## 10. DECISIONS LOCKED (2026-05-30)

1. **Positioning: multi-product company.** Bloom is presented as an umbrella brand, with
   ChildBloom as the first/flagship product and more products on the roadmap.
2. **Placement: separate marketing site.** The ecosystem landing is a standalone marketing
   site on a real Bloom domain that links *into* the ChildBloom app — not a route inside
   the app.
3. **Next step: context only.** Do not build the page yet. This doc is the brief.

### Honest reality check
Today, only **ChildBloom (with Dr. Bloom inside)** is live. A multi-product marketing site
is therefore a *vision site*. Before/while building it, decide which additional products are
real roadmap vs. "coming soon" placeholders. Marketing more than exists is fine for a vision
site **as long as live vs. coming-soon is visually honest** (badges like "Available now" vs.
"Coming 2026").

---

## 11. Proposed multi-product Bloom ecosystem

All of these extend naturally from the existing codebase, child-development data model, and
Dr. Bloom engine. Marked by how real they are today.

| Product | What it is | Status today | Build effort |
|---|---|---|---|
| **ChildBloom** | The parent app: track, understand, care, prepare, grow (pregnancy→age 7) | **LIVE** (closed test) | Shipped |
| **Dr. Bloom** | The pediatric AI advisor — could be surfaced as its own named capability/API | Live *inside* ChildBloom | Done; could expose standalone |
| **Bloom for Doctors** | Clinician view of the doctor-ready PDF / shared child records; pediatrician dashboard | Data + PDF exist; portal is net-new | Medium |
| **BloomBump** *(working name)* | Pregnancy-only companion (the prenatal path already exists in the age engine) | Prenatal logic already in code | Low-Medium |
| **Bloom Garden** | The gamified milestone/celebration layer, as a standalone engagement surface | Built as a feature already | Low (reframe) |
| **Bloom for Schools / Anganwadi** | Cohort child-development tracking for caregivers/centres | Vision | High |

**Recommended honest framing for v1 of the site:**
- **Available now:** ChildBloom, Dr. Bloom (as its named AI).
- **Coming soon (roadmap):** Bloom for Doctors, BloomBump.
This gives the "ecosystem" feel without overpromising.

---

## 12. What a separate marketing site needs (checklist)

- **Domain.** Pick + buy one. Candidates: `bloom.health`, `bloomenterprise.com`,
  `childbloom.app`, `getbloom.in`. (Currently only `childbloom-pi.vercel.app` exists.)
- **Separate deploy.** New Vercel project (static site), independent of the app repo.
- **Links into the app.** Every product CTA points to the live app / Play Store test link.
- **Shared design system.** Reuse the tokens in §2 + the existing `LandingPage.jsx` visual
  language so the marketing site and app are visibly one brand.
- **Pages:** Home (ecosystem), ChildBloom (product), Dr. Bloom (AI), About/Bloom (company),
  Privacy, Contact.
- **SEO/meta + OG images** per page (the app SPA can't do this well; a static marketing
  site can — a real reason to keep it separate).
- **Analytics** (Plausible / Vercel Analytics).

### Open question to resolve next
**What is the real next product after ChildBloom?** The multi-product story is only as
strong as product #2. Pick it (Bloom for Doctors and BloomBump are the cheapest, most
credible options given what's already built) — that decision drives the whole site.
