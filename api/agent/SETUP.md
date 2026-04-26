# ChildBloom Social Agent — Setup Guide

## Environment Variables to add in Vercel

Go to: Vercel Dashboard → childbloom project → Settings → Environment Variables

### Already have (from your server .env):
```
SUPABASE_URL=https://qkjwmcmdevtbvcanamjg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
ANTHROPIC_API_KEY=<your anthropic key>
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### Twitter/X (add these):
```
TWITTER_CONSUMER_KEY=T5Vga4ZfRtWWLtd6C3HH4YJBk
TWITTER_CONSUMER_SECRET=8wda3iCCSGtZklsJWtDG8DsVAaeXOL48Lz1zAuswNGSzIFykei
TWITTER_ACCESS_TOKEN=        ← GET THIS (see below)
TWITTER_ACCESS_TOKEN_SECRET= ← GET THIS (see below)
```

### Security secret (generate any random string):
```
CRON_SECRET=childbloom-agent-2026
```

---

## How to get Twitter Access Token + Secret

1. Go to https://developer.twitter.com/en/portal/projects-and-apps
2. Click your app
3. Go to "Keys and Tokens"
4. Under "Authentication Tokens" → click "Generate" next to Access Token & Secret
5. ⚠️ Make sure your app has "Read and Write" permissions BEFORE generating!
   (App Settings → User authentication settings → App permissions → Read and Write)
6. Copy both values into Vercel env vars above

---

## Cron Schedule

The agent runs automatically twice a day:
- **8:00 AM IST** (2:30 AM UTC) — Morning post
- **6:00 PM IST** (12:30 PM UTC) — Evening post + daily brief

---

## Check the Daily Brief

Hit this endpoint anytime to see recent posts and stats:
```
GET https://your-vercel-url.vercel.app/api/agent/brief
```

---

## Test Manually

Trigger the agent manually (for testing) by running in your terminal:
```bash
curl -X GET https://your-vercel-url.vercel.app/api/agent/cron \
  -H "Authorization: Bearer childbloom-agent-2026"
```
