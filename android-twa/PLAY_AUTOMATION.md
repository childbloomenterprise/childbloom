# ChildBloom — Play Store Automation

Python scripts that drive the Google Play Developer API so closed-testing
releases and tester distribution are one command instead of clicking through
the Play Console.

App: **`com.childbloom.app`** · Track: **alpha** (closed testing) · Tester group:
**`bloom-v1-testers@googlegroups.com`**

## The blocker these scripts serve

Google requires **20 testers opted in for 14 continuous days** (personal dev
account) before production review. These scripts make the *download path*
bulletproof so the only variable left is recruiting humans.

## Setup (one time)

These run on the **Windows dev box** (PowerShell, not the Linux sandbox).

```powershell
pip install google-api-python-client google-auth
$env:PYTHONIOENCODING = "utf-8"   # needed for the emoji output on Windows
```

Required files (already in place):
- Service account key: `C:\Users\vaish\keys\play-store-api-key.json`
- Release keystore:     `C:\Users\vaish\keys\childbloom-release.keystore` (alias `childbloom`)
- Tester list:          `C:\Users\vaish\keys\testers.txt`

## The scripts

Run all of them from this folder (`android-twa/`).

| Script | Writes? | What it does |
|---|---|---|
| `play_config.py`     | — | **Single source of truth.** Package, paths, tester group, release notes. `VERSION_CODE` + `RELEASE_NAME` are parsed **live from `app/build.gradle`**, so the scripts can never drift from the AAB Gradle actually builds. Not run directly. |
| `play_deep_check.py` | No  | Read-only deep diagnostic: every track, all uploaded bundles + sha256, tester groups, country targeting, then a tester self-check message for "App not available" errors. Opens an edit but always rolls it back. |
| `play_doctor.py`     | Yes | Diagnose **and auto-fix** the two things that break testing — release not `completed`, or tester group not linked — then prints the WhatsApp-ready opt-in message. Use `--check` for diagnose-only (no changes). |
| `play_status.py`     | No  | Quick one-shot track status. |
| `play_release.py`    | Yes | Build the AAB, upload it, promote to alpha, optionally link the tester group. |

## Common commands

```powershell
# Is everything healthy? (read-only — safe to run anytime)
python play_doctor.py --check

# Auto-fix track/tester issues + print the message to send testers
python play_doctor.py

# Deep diagnostic when a tester reports "App not available"
python play_deep_check.py

# Ship a NEW build (after bumping versionCode in app/build.gradle):
python play_release.py            # build + upload + release
python play_release.py --all      # build + upload + release + link testers
python play_release.py --add-testers   # link the tester group only
```

## Shipping an update — the full loop

1. **Bump the version** in `app/build.gradle` — `versionCode` (must be a new,
   higher integer; Play rejects reused codes) and `versionName` if it's a real
   release. Every script reads these automatically; do **not** hardcode them
   anywhere else.
2. `python play_release.py --all`
3. `python play_doctor.py --check` to confirm it landed as `completed`.

> **Web-only changes** (anything in `client/` / `api/`) go live instantly via
> Vercel — no rebuild, no Play upload needed. Only native/TWA shell changes
> require a new AAB.

## Gotchas (learned the hard way)

- **versionCode can't be reused** → always bump in `build.gradle` first.
- **Signing is handled by Gradle's `signingConfig`** — never also `jarsigner`
  (double-signing corrupts the AAB).
- **`countryTargeting` only applies to *staged* rollouts**, not `completed`
  releases — leave it off; set track countries in the Console UI. Current alpha
  has no country targeting (available everywhere).
- **The Testers API only accepts Google Groups**, not individual emails. That's
  why distribution moved to the `bloom-v1-testers` group — testers join the
  group, then opt in. Individuals-only would force manual Console entry.
- **The opt-in link only works on an Android phone**, not a laptop browser, and
  the tester's active Play Store account must match the Gmail that joined the
  group. `play_deep_check.py` prints the tester-side checklist for this.

## Current state (2026-06-06)

- **vc5 / `1.1.0` LIVE on alpha, status `completed`.** Tester group linked.
  Play-Store side is fully clean — remaining blocker is purely getting from
  ~13 → 20 opted-in testers and running the 14-day clock.
