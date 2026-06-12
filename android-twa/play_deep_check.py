#!/usr/bin/env python3
"""
ChildBloom — Deep diagnostic for "App not available" tester errors.
Checks everything the Play API can expose: bundles, device targets,
track state, tester list, and prints a tester self-check message.

Usage:
  python play_deep_check.py
"""

import json, os, sys

from googleapiclient.errors import HttpError

import play_config as cfg

PACKAGE  = cfg.PACKAGE
KEY_FILE = cfg.SERVICE_ACCOUNT_FILE
TRACK    = cfg.TRACK

def ok(m):   print(f"  ✅  {m}")
def warn(m): print(f"  ⚠️   {m}")
def err(m):  print(f"  ❌  {m}")
def info(m): print(f"  ·   {m}")
def head(m): print(f"\n{'━'*60}\n  {m}\n{'━'*60}")

def main():
    svc, email = cfg.build_service()
    ok(f"Authenticated as {email}")

    edit = svc.edits().insert(body={}, packageName=PACKAGE).execute()
    eid  = edit["id"]
    info(f"Edit id={eid}")

    try:
        # ── 1. All tracks ──────────────────────────────────────────────────────
        head("1 · ALL TRACKS")
        tracks = svc.edits().tracks().list(packageName=PACKAGE, editId=eid).execute()
        for t in tracks.get("tracks", []):
            name = t["track"]
            for r in t.get("releases", []):
                vcs    = r.get("versionCodes", [])
                status = r.get("status", "?")
                rname  = r.get("name", "?")
                print(f"  TRACK '{name}' | release '{rname}' | vc={vcs} | status={status}")

        # ── 2. Alpha track detail ──────────────────────────────────────────────
        head("2 · ALPHA TRACK DETAIL")
        alpha = svc.edits().tracks().get(
            packageName=PACKAGE, editId=eid, track=TRACK).execute()
        print(json.dumps(alpha, indent=4))

        # ── 3. Tester groups ───────────────────────────────────────────────────
        head("3 · TESTER GROUPS ON ALPHA")
        testers = svc.edits().testers().get(
            packageName=PACKAGE, editId=eid, track=TRACK).execute()
        groups = testers.get("googleGroups", [])
        emails = testers.get("googleEmails", [])
        if groups:
            ok(f"Google Groups: {groups}")
        else:
            err("No Google Groups linked!")
        if emails:
            info(f"Individual emails: {emails}")
        else:
            info("No individual emails (using group only — OK)")

        # ── 4. Bundles / APKs ─────────────────────────────────────────────────
        head("4 · UPLOADED BUNDLES (AABs)")
        bundles = svc.edits().bundles().list(
            packageName=PACKAGE, editId=eid).execute()
        for b in bundles.get("bundles", []):
            vc      = b.get("versionCode")
            sha1    = b.get("sha1", "?")
            sha256  = b.get("sha256", "?")
            ok(f"versionCode={vc} | sha256={sha256[:20]}...")

        # ── 5. APKs (legacy) ──────────────────────────────────────────────────
        head("5 · UPLOADED APKs (legacy)")
        apks = svc.edits().apks().list(
            packageName=PACKAGE, editId=eid).execute()
        apk_list = apks.get("apks", [])
        if apk_list:
            for a in apk_list:
                warn(f"APK versionCode={a.get('versionCode')} (legacy — prefer AAB)")
        else:
            ok("No legacy APKs — AAB-only (correct)")

        # ── 6. Country targeting ───────────────────────────────────────────────
        head("6 · COUNTRY TARGETING CHECK")
        releases = alpha.get("releases", [])
        for r in releases:
            ct = r.get("countryTargeting")
            if ct:
                countries = ct.get("countries", [])
                exclude   = ct.get("includeRestOfWorld", False)
                warn(f"Country targeting ACTIVE: {countries} | includeRestOfWorld={exclude}")
                if "IN" not in countries:
                    err("India (IN) is NOT in the country list — testers need Indian accounts!")
                else:
                    ok(f"India is included in country targeting")
            else:
                ok("No country targeting — app available to all countries ✓")

        # ── 7. Diagnosis summary ───────────────────────────────────────────────
        head("7 · DIAGNOSIS SUMMARY")
        issues = []
        if not groups:
            issues.append("No Google Group linked to alpha track")
        for r in alpha.get("releases", []):
            if r.get("status") != "completed":
                issues.append(f"Release status is '{r.get('status')}' not 'completed'")
            ct = r.get("countryTargeting")
            if ct and "IN" not in ct.get("countries", []):
                issues.append("Country targeting excludes India")

        if not issues:
            ok("Play Store side: ALL CLEAN")
            print()
            warn("Error must be on the TESTER'S DEVICE/ACCOUNT side (see message below)")
        else:
            for i in issues:
                err(i)

    finally:
        svc.edits().delete(packageName=PACKAGE, editId=eid).execute()
        info("Edit closed (read-only — no changes)")

    # ── Tester self-check message ──────────────────────────────────────────────
    print(f"""
{'='*60}
  🔍  SEND THIS TO EACH TESTER WHO GETS THE ERROR
{'='*60}

Hey! Getting "App not available"? Please check these:

1️⃣  SAME ACCOUNT — The Google account you used to join the
    tester group must be the ACTIVE account on your phone.
    Check: Play Store → top-right profile → which account?
    It must match the Gmail you used to join the group.

2️⃣  COUNTRY — Your Play Store account must be set to India.
    Check: Play Store → Profile → Manage account → Country
    If it shows another country, the app won't appear.

3️⃣  ORDER — Did you follow this exact order?
    a) Join group: https://groups.google.com/g/bloom-v1-testers
    b) WAIT 5 MINUTES (not 2 — give it time to propagate)
    c) Open on ANDROID PHONE (not laptop/browser):
       https://play.google.com/apps/testing/com.childbloom.app
    d) Tap "Become a tester"
    e) Tap "Download it on Google Play"
    f) Install

4️⃣  BROWSER vs PHONE — The opt-in link only works on Android.
    Opening it on a laptop/PC will always fail.

5️⃣  CLEAR PLAY STORE CACHE — If still failing:
    Settings → Apps → Google Play Store → Storage → Clear cache
    Then retry step c onwards.

Reply with which step failed and I'll fix it! 🙏
{'='*60}
""")

if __name__ == "__main__":
    main()
