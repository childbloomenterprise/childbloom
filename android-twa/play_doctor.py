#!/usr/bin/env python3
"""
ChildBloom — Play Store Doctor
One command that checks everything, fixes what's broken, and prints
exactly what to send testers.

Usage (run from android-twa/):
  python play_doctor.py          # diagnose + auto-fix + print tester message
  python play_doctor.py --check  # diagnose only, no changes
"""

import json, sys, os

from googleapiclient.errors import HttpError

import play_config as cfg

# ── Config (single source of truth → play_config.py) ──────────────────────────
PACKAGE      = cfg.PACKAGE
KEY_FILE     = cfg.SERVICE_ACCOUNT_FILE
TRACK        = cfg.TRACK
GROUP_EMAIL  = cfg.GROUP_EMAIL
VERSION_CODE = cfg.VERSION_CODE          # parsed live from build.gradle
RELEASE_NAME = cfg.RELEASE_NAME          # parsed live from build.gradle (was hardcoded "1.0.0")
RELEASE_NOTE = cfg.RELEASE_NOTES_TEXT

OPT_IN_LINK  = cfg.OPT_IN_LINK
GROUP_LINK   = cfg.GROUP_LINK

CHECK_ONLY   = "--check" in sys.argv

# ── Helpers ───────────────────────────────────────────────────────────────────
def ok(m):    print(f"  ✅  {m}")
def warn(m):  print(f"  ⚠️   {m}")
def err(m):   print(f"  ❌  {m}")
def info(m):  print(f"  ·   {m}")
def head(m):  print(f"\n{'━'*55}\n  {m}\n{'━'*55}")

def build_service():
    svc, email = cfg.build_service()
    ok(f"Authenticated as {email}")
    return svc

def open_edit(svc):
    r = svc.edits().insert(body={}, packageName=PACKAGE).execute()
    info(f"Edit opened → id={r['id']}")
    return r["id"]

def abort_edit(svc, eid):
    try:
        svc.edits().delete(packageName=PACKAGE, editId=eid).execute()
        info("Edit rolled back (no changes made)")
    except Exception:
        pass

def commit_edit(svc, eid):
    r = svc.edits().commit(packageName=PACKAGE, editId=eid).execute()
    ok(f"Changes committed → id={r.get('id','?')}")

# ── Checks ────────────────────────────────────────────────────────────────────
def check_track(svc, eid):
    """Returns (release_exists, status, needs_fix)"""
    resp = svc.edits().tracks().get(
        packageName=PACKAGE, editId=eid, track=TRACK).execute()
    releases = resp.get("releases", [])
    if not releases:
        err(f"Track '{TRACK}': NO release found")
        return False, None, True
    r = releases[0]
    status = r.get("status", "?")
    vcs    = r.get("versionCodes", [])
    name   = r.get("name", "?")
    if status == "completed":
        ok(f"Track '{TRACK}': release '{name}' vc={vcs} → PUBLISHED ✓")
        return True, status, False
    else:
        warn(f"Track '{TRACK}': release '{name}' vc={vcs} → status='{status}' (not published!)")
        return True, status, True

def check_testers(svc, eid):
    """Returns (group_linked, needs_fix)"""
    resp = svc.edits().testers().get(
        packageName=PACKAGE, editId=eid, track=TRACK).execute()
    groups = resp.get("googleGroups", [])
    if GROUP_EMAIL in groups:
        ok(f"Tester group '{GROUP_EMAIL}' → linked ✓")
        return True, False
    else:
        warn(f"Tester group '{GROUP_EMAIL}' → NOT linked (found: {groups or 'none'})")
        return False, True

# ── Fixes ─────────────────────────────────────────────────────────────────────
def fix_track(svc, eid):
    info(f"Publishing vc{VERSION_CODE} to '{TRACK}' as 'completed'...")
    body = {
        "track": TRACK,
        "releases": [{
            "name":         RELEASE_NAME,
            "versionCodes": [str(VERSION_CODE)],
            "status":       "completed",
            "releaseNotes": [{"language": "en-IN", "text": RELEASE_NOTE}],
        }],
    }
    svc.edits().tracks().update(
        packageName=PACKAGE, editId=eid, track=TRACK, body=body).execute()
    ok(f"Track set to 'completed'")

def fix_testers(svc, eid):
    info(f"Linking tester group '{GROUP_EMAIL}'...")
    svc.edits().testers().update(
        packageName=PACKAGE, editId=eid, track=TRACK,
        body={"googleGroups": [GROUP_EMAIL]}).execute()
    ok(f"Tester group linked")

# ── Tester message ────────────────────────────────────────────────────────────
def print_tester_message():
    print(f"""
{'='*55}
  📲  SEND THIS TO YOUR FRIEND (WhatsApp-ready)
{'='*55}

Hey! Please help me test my app ChildBloom 🙏

Two quick steps on your Android phone:

1️⃣  Join the tester group (takes 10 sec):
{GROUP_LINK}
→ Click "Ask to join" or "Join group"

2️⃣  Wait 2 minutes, then open this link:
{OPT_IN_LINK}
→ Tap "Become a tester"
→ Tap "Download on Google Play"
→ Install the app

That's it! Please keep it installed for 14 days.
Share this message with others — I need 20 testers total.

Thank you! 🌸

{'='*55}
  📋  CHECKLIST FOR EACH TESTER
{'='*55}
  ✓ Android phone (any version 7+)
  ✓ Indian Google account (Play Store country = India)
  ✓ Join group FIRST, wait 2 min, THEN click opt-in link
  ✓ Must install from Play Store (not APK)
  ✓ Keep installed for 14 days
{'='*55}
""")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    head("1 · Authenticate")
    if not os.path.exists(KEY_FILE):
        err(f"Key not found: {KEY_FILE}"); sys.exit(1)
    svc = build_service()

    head("2 · Open edit")
    eid = open_edit(svc)

    fixes_needed = []
    try:
        head("3 · Check release status")
        _, _, track_needs_fix = check_track(svc, eid)
        if track_needs_fix:
            fixes_needed.append("track")

        head("4 · Check tester group")
        _, tester_needs_fix = check_testers(svc, eid)
        if tester_needs_fix:
            fixes_needed.append("testers")

        head("5 · Summary")
        if not fixes_needed:
            ok("Everything looks good! No fixes needed.")
            abort_edit(svc, eid)
        elif CHECK_ONLY:
            warn(f"Issues found: {fixes_needed}")
            warn("Run without --check to auto-fix.")
            abort_edit(svc, eid)
        else:
            warn(f"Fixing: {fixes_needed}")
            if "track" in fixes_needed:
                fix_track(svc, eid)
            if "testers" in fixes_needed:
                fix_testers(svc, eid)
            head("6 · Commit fixes")
            commit_edit(svc, eid)
            ok("All issues fixed and committed!")

    except HttpError as e:
        err(f"API error: {e.resp.status}")
        try:
            body = json.loads(e.content.decode())
            print(json.dumps(body, indent=4))
        except Exception:
            print(e.content.decode())
        abort_edit(svc, eid)
        sys.exit(1)

    print_tester_message()

if __name__ == "__main__":
    main()
