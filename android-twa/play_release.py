#!/usr/bin/env python3
"""
ChildBloom — Google Play Developer API release script
Builds AAB, uploads it, promotes to alpha track, and links testers.

Usage (run from the android-twa project root):
  python play_release.py              # upload + release
  python play_release.py --add-testers  # tester group only
  python play_release.py --all          # upload + release + testers
"""

import json, sys, os, subprocess

from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

import play_config as cfg

# ── Config (single source of truth → play_config.py) ────────────────────────
PACKAGE_NAME         = cfg.PACKAGE
VERSION_CODE         = cfg.VERSION_CODE          # parsed live from build.gradle
TRACK_NAME           = cfg.TRACK
RELEASE_NAME         = cfg.RELEASE_NAME          # parsed live from build.gradle
RELEASE_STATUS       = "completed"
RELEASE_NOTES_LANG   = cfg.RELEASE_NOTES_LANG
RELEASE_NOTES_TEXT   = cfg.RELEASE_NOTES_TEXT

SERVICE_ACCOUNT_FILE = cfg.SERVICE_ACCOUNT_FILE
TESTERS_FILE         = cfg.TESTERS_FILE
GROUP_EMAIL          = cfg.GROUP_EMAIL
AAB_PATH             = cfg.AAB_PATH

# ── Helpers ──────────────────────────────────────────────────────────────────
def ok(m):   print(f"  ✓ {m}")
def err(m):  print(f"  ✗ {m}")
def info(m): print(f"  · {m}")

def print_http_error(e):
    err(f"HTTP {e.resp.status}")
    try:
        body = json.loads(e.content.decode())
        print(f"\n    Full Google API error:\n{json.dumps(body, indent=4)}\n")
    except Exception:
        print(f"    Raw: {e.content.decode()}\n")

def build_service():
    svc, email = cfg.build_service()
    ok(f"Authenticated as {email}")
    return svc

def open_edit(svc):
    r = svc.edits().insert(body={}, packageName=PACKAGE_NAME).execute()
    ok(f"Edit opened  →  id={r['id']}")
    return r["id"]

def abort_edit(svc, edit_id):
    try:
        svc.edits().delete(packageName=PACKAGE_NAME, editId=edit_id).execute()
        info("Edit rolled back")
    except Exception:
        pass

def build_aab():
    info("Running: gradlew bundleRelease ...")
    result = subprocess.run(
        ["gradlew.bat", "bundleRelease"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        err("Gradle build failed:")
        print(result.stdout[-3000:])
        print(result.stderr[-1000:])
        sys.exit(1)
    if not os.path.exists(AAB_PATH):
        err(f"AAB not found at {AAB_PATH} after build")
        sys.exit(1)
    ok(f"AAB built → {AAB_PATH}")

def upload_bundle(svc, edit_id):
    if not os.path.exists(AAB_PATH):
        err(f"AAB not found: {AAB_PATH} — run build first or use --skip-build")
        sys.exit(1)
    info(f"Uploading {AAB_PATH} ...")
    media = MediaFileUpload(AAB_PATH, mimetype="application/octet-stream", resumable=True)
    r = svc.edits().bundles().upload(
        packageName=PACKAGE_NAME,
        editId=edit_id,
        media_body=media
    ).execute()
    vc = r.get("versionCode")
    ok(f"Uploaded versionCode={vc}")
    if vc != VERSION_CODE:
        err(f"Uploaded vc={vc} but expected vc={VERSION_CODE} — check build.gradle")
        sys.exit(1)

def update_track(svc, edit_id):
    body = {
        "track": TRACK_NAME,
        "releases": [{
            "name":         RELEASE_NAME,
            "versionCodes": [str(VERSION_CODE)],
            "status":       RELEASE_STATUS,
            "releaseNotes": [{"language": RELEASE_NOTES_LANG, "text": RELEASE_NOTES_TEXT}],
        }],
    }
    svc.edits().tracks().update(
        packageName=PACKAGE_NAME, editId=edit_id, track=TRACK_NAME, body=body
    ).execute()
    ok(f"Track '{TRACK_NAME}' → vc={VERSION_CODE} status=completed")

def update_testers(svc, edit_id):
    group = os.environ.get("TESTER_GROUP", GROUP_EMAIL).strip()
    if not group:
        info("No tester group set — skipping"); return
    info(f"Linking tester group: {group}")
    svc.edits().testers().update(
        packageName=PACKAGE_NAME, editId=edit_id, track=TRACK_NAME,
        body={"googleGroups": [group]}
    ).execute()
    ok(f"Tester group '{group}' linked to '{TRACK_NAME}'")

def commit_edit(svc, edit_id):
    r = svc.edits().commit(packageName=PACKAGE_NAME, editId=edit_id).execute()
    ok(f"Edit committed  →  id={r.get('id','?')}")

# ── Modes ─────────────────────────────────────────────────────────────────────
def run_release(add_testers=False, skip_build=False):
    if not skip_build:
        print("\n━━━ 0 · Build AAB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        build_aab()
    print("\n━━━ 1 · Authenticate ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    svc = build_service()
    print("\n━━━ 2 · Open edit ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    edit_id = open_edit(svc)
    try:
        print("\n━━━ 3 · Upload AAB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        upload_bundle(svc, edit_id)
        print("\n━━━ 4 · Update alpha track ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        update_track(svc, edit_id)
        if add_testers:
            print("\n━━━ 5 · Link tester group ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            update_testers(svc, edit_id)
        print("\n━━━ 6 · Commit ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        commit_edit(svc, edit_id)
    except HttpError as e:
        print_http_error(e); abort_edit(svc, edit_id); sys.exit(1)
    print(f"\n✅  Done! versionCode {VERSION_CODE} is live on alpha track.\n")

def run_testers_only():
    print("\n━━━ Tester-only mode ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    svc = build_service()
    edit_id = open_edit(svc)
    try:
        update_testers(svc, edit_id)
        commit_edit(svc, edit_id)
    except HttpError as e:
        print_http_error(e); abort_edit(svc, edit_id); sys.exit(1)
    print("\n✅  Testers updated.\n")

# ── Entry ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    args = sys.argv[1:]
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        err(f"Key not found at {SERVICE_ACCOUNT_FILE}")
        sys.exit(1)
    if "--add-testers" in args:
        run_testers_only()
    elif "--all" in args:
        run_release(add_testers=True, skip_build="--skip-build" in args)
    else:
        run_release(add_testers=False, skip_build="--skip-build" in args)
