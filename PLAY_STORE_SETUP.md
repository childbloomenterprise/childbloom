# ChildBloom — Play Store Submission Guide

## PREREQUISITES

- Node.js 18+ installed
- Java JDK 11+ installed (`java -version` to check)
- Android Studio installed (for keystore generation, optional)
- Google Play Developer account ($25 one-time at play.google.com/apps/publish)
- ChildBloom deployed to Vercel at `childbloom-pi.vercel.app`

---

## STEP 1 — INSTALL BUBBLEWRAP

```bash
npm install -g @bubblewrap/cli
```

Verify: `bubblewrap --version`

---

## STEP 2 — INITIALIZE TWA PROJECT

```bash
bubblewrap init --manifest=https://childbloom-pi.vercel.app/manifest.json
```

When prompted, enter these exact values:

| Prompt | Value |
|--------|-------|
| Package ID | `com.childbloom.app` |
| App name | `ChildBloom` |
| Launcher name | `ChildBloom` |
| Theme color | `#1D9E75` |
| Background color | `#F8FAF9` |
| Start URL | `/` |
| Icon URL | `https://childbloom-pi.vercel.app/logo512.png` |
| Maskable icon URL | `https://childbloom-pi.vercel.app/logo512.png` |

This generates an Android project in the current directory.

---

## STEP 3 — GENERATE SIGNING KEYSTORE

> **CRITICAL: Never commit the keystore file to GitHub.**

```bash
keytool -genkey -v \
  -keystore android-keystore.jks \
  -alias childbloom \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

When prompted:
- First and last name: your name or "ChildBloom"
- Organization unit: ChildBloom
- Organization: ChildBloom Enterprise
- City: your city
- State: Kerala (or your state)
- Country code: IN

**Save the keystore password somewhere safe.** You need it for every future update.
Every update to the Play Store must be signed with the same keystore.

---

## STEP 4 — GET SHA256 FINGERPRINT

```bash
keytool -list -v \
  -keystore android-keystore.jks \
  -alias childbloom
```

Find the line that says `SHA256:` and copy the fingerprint.
It looks like: `AB:CD:EF:12:34:...`

**Paste it into:**
`client/public/.well-known/assetlinks.json`

Replace `REPLACE_WITH_YOUR_KEYSTORE_SHA256_FINGERPRINT` with your fingerprint
(remove colons — use the colon-separated format as-is).

Then deploy to Vercel:
```bash
npx vercel deploy --prod --yes
```

Verify it works:
```
https://childbloom-pi.vercel.app/.well-known/assetlinks.json
```
Should return JSON with your fingerprint.

Also test Digital Asset Links:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://childbloom-pi.vercel.app&relation=delegate_permission/common.handle_all_urls
```

---

## STEP 5 — BUILD THE APK / AAB

```bash
bubblewrap build
```

This creates two files:
- `app-release-bundle.aab` → **Upload this to Play Store**
- `app-release-signed.apk` → Use this for direct device testing

**Build time:** ~5-10 minutes on first run (downloads Android SDK).

---

## STEP 6 — TEST ON YOUR PHONE

Option A — via USB:
```bash
adb install app-release-signed.apk
```

Option B — direct install (easier):
Send the `.apk` file to your phone via WhatsApp or email.
On your phone: Settings → Security → Allow unknown sources → Install.

**What to test:**
- App opens and shows ChildBloom correctly
- Login works
- Dr. Bloom chat responds
- Weekly check-in saves
- Works offline (turn off WiFi and mobile data)
- App icon shows on home screen

---

## STEP 7 — PLAY STORE LISTING

Go to: **play.google.com/apps/publish**

Create a new app and fill in:

### App name
```
ChildBloom — Child Development
```

### Short description (80 chars max)
```
AI-powered child development companion for Indian parents
```

### Full description
```
ChildBloom helps Indian parents guide their child's development from pregnancy through age 7.

🌱 Dr. Bloom — Your AI Pediatric Advisor
Get personalized insights after every weekly check-in, ask any parenting question in Malayalam, Tamil, or English, and receive warm guidance backed by WHO, AAP, and IAP research.

📊 Weekly Development Tracking
Log your child's height, weight, mood, milestones, and feeding every week. Watch their growth curve compared to WHO standards in real time.

🍚 Indian Food Tracker
Track meals with an Indian food database — ragi, dal, idli, Nendran banana, and 50+ more foods your baby actually eats.

💉 Vaccination Schedule
India's complete IAP 2024 vaccination schedule so you never miss a dose.

🌐 Works in Malayalam, Tamil, Hindi, and English
Built specifically for Indian parents, with deep Kerala and South Indian cultural context.

From the moment you discover you're pregnant to your child's 7th birthday — ChildBloom grows with you.

DISCLAIMER: ChildBloom is an informational tool and does not replace professional medical advice. Always consult your pediatrician for health concerns.
```

### Store details
| Field | Value |
|-------|-------|
| Category | Health & Fitness |
| Content rating | Everyone |
| Target audience | Adults (parents) |
| Privacy policy URL | `https://childbloom-pi.vercel.app/privacy` |

---

## STEP 8 — REQUIRED SCREENSHOTS

Use Chrome DevTools (F12 → device toolbar) set to **390 x 844** (iPhone 14 size).

Take screenshots of:
1. Dashboard ("Good morning, [name]")
2. Weekly check-in form
3. Dr. Bloom AI chat with a response
4. Growth chart with percentile lines
5. Development guides page

Minimum size: 1080×1920px. Use the "Capture screenshot" button in DevTools.

**Feature graphic:** 1024×500px
- Teal (#1D9E75) background
- ChildBloom logo centered
- Tagline: "Growing together, week by week."
- Can be made in Canva: canva.com

---

## STEP 9 — UPLOAD AND SUBMIT

1. Go to Play Console → Create app → Upload `.aab` file
2. Fill in store listing (description + screenshots + feature graphic)
3. Set content rating (answer questionnaire — select "No" to violence/gambling etc.)
4. Set up pricing (Free)
5. Review the pre-launch report
6. Submit for review

**Review time:** 3–7 business days for first submission.
Updates after approval: usually 2–4 hours.

---

## FUTURE UPDATES

Every time you push changes to Vercel, the app auto-updates
(it's a TWA — the content comes from your website).

To update the app version on Play Store:
1. Update `appVersionCode` (increment by 1) and `appVersionName` in `twa-manifest.json`
2. Run `bubblewrap build`
3. Upload new `.aab` to Play Console

---

## TROUBLESHOOTING

**"Digital asset links verification failed"**
→ Check assetlinks.json is accessible at the URL
→ Verify SHA256 fingerprint matches exactly (with colons, uppercase)

**App shows browser UI instead of standalone**
→ assetlinks.json fingerprint doesn't match keystore
→ Regenerate and redeploy

**Build fails**
→ Run `bubblewrap doctor` to check dependencies
→ Ensure Java JDK 11+ is installed

---

## GITIGNORE REMINDER

These files are already in `.gitignore`:
- `android-keystore.jks` — NEVER commit this
- `*.jks`

Keep a backup of your keystore file somewhere secure (Google Drive, etc.).
Losing the keystore means you cannot update the Play Store app.
