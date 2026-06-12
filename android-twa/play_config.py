#!/usr/bin/env python3
"""
ChildBloom — shared Play Store automation config + helpers.

Single source of truth for play_release.py, play_doctor.py and
play_deep_check.py so versionCode, release name, package, key paths
and the tester group can never drift apart again.

VERSION_CODE and RELEASE_NAME are parsed LIVE from app/build.gradle,
so they always match the AAB that Gradle actually builds — change the
version in one place (build.gradle) and every script follows.
"""

import os
import re
import warnings

warnings.filterwarnings("ignore")

from google.oauth2 import service_account
from googleapiclient.discovery import build

# ── Static identity ─────────────────────────────────────────────────────────
PACKAGE = "com.childbloom.app"
TRACK = "alpha"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

# ── Local paths (Windows dev box) ───────────────────────────────────────────
SERVICE_ACCOUNT_FILE = r"C:\Users\vaish\keys\play-store-api-key.json"
TESTERS_FILE = r"C:\Users\vaish\keys\testers.txt"

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
BUILD_GRADLE = os.path.join(_THIS_DIR, "app", "build.gradle")
AAB_PATH = os.path.join(
    _THIS_DIR, "app", "build", "outputs", "bundle", "release", "app-release.aab"
)

# ── Tester distribution ─────────────────────────────────────────────────────
GROUP_EMAIL = "bloom-v1-testers@googlegroups.com"
GROUP_LINK = "https://groups.google.com/g/bloom-v1-testers"
OPT_IN_LINK = f"https://play.google.com/apps/testing/{PACKAGE}"

# ── Release notes ───────────────────────────────────────────────────────────
RELEASE_NOTES_LANG = "en-US"
RELEASE_NOTES_TEXT = (
    "Updated ChildBloom — childbloom.in. "
    "AI-powered child development companion for parents everywhere."
)


# ── Version parsed live from build.gradle (never drifts) ────────────────────
def read_gradle_version(path=BUILD_GRADLE):
    """Return (version_code: int, version_name: str) read from build.gradle."""
    try:
        with open(path, encoding="utf-8") as f:
            src = f.read()
    except FileNotFoundError:
        raise SystemExit(f"  ✗ build.gradle not found: {path}")
    code = re.search(r"versionCode\s+(\d+)", src)
    name = re.search(r'versionName\s+"([^"]+)"', src)
    if not code or not name:
        raise SystemExit("  ✗ Could not parse versionCode/versionName from build.gradle")
    return int(code.group(1)), name.group(1)


VERSION_CODE, RELEASE_NAME = read_gradle_version()


# ── Shared auth ─────────────────────────────────────────────────────────────
def require_key():
    """Exit with a clear message if the service-account key is missing."""
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        raise SystemExit(f"  ✗ Service account key not found: {SERVICE_ACCOUNT_FILE}")


def build_service():
    """Authenticate and return (androidpublisher_service, service_account_email)."""
    require_key()
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    svc = build("androidpublisher", "v3", credentials=creds)
    return svc, creds.service_account_email
