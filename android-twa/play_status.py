#!/usr/bin/env python3
"""Read-only status check of the ChildBloom Play Store tracks."""
import json, warnings
warnings.filterwarnings("ignore")
from google.oauth2 import service_account
from googleapiclient.discovery import build

PKG = "com.childbloom.app"
KEY = r"C:\Users\vaish\keys\play-store-api-key.json"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

creds = service_account.Credentials.from_service_account_file(KEY, scopes=SCOPES)
svc = build("androidpublisher", "v3", credentials=creds)
print(f"Authenticated: {creds.service_account_email}\n")

edit = svc.edits().insert(body={}, packageName=PKG).execute()
eid = edit["id"]
try:
    tracks = svc.edits().tracks().list(packageName=PKG, editId=eid).execute()
    for t in tracks.get("tracks", []):
        name = t["track"]
        rels = t.get("releases", [])
        if not rels:
            print(f"TRACK '{name}': (no active release)")
            continue
        for r in rels:
            vcs = r.get("versionCodes", [])
            status = r.get("status", "?")
            rname = r.get("name", "?")
            print(f"TRACK '{name}': release '{rname}' versionCodes={vcs} status={status}")
finally:
    svc.edits().delete(packageName=PKG, editId=eid).execute()
