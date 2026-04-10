# ChildBloom

A warm, emotionally intelligent child development companion for Indian parents — built with React, Vercel serverless functions, Supabase, and Claude AI (Dr. Bloom persona).

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project
3. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
   - Application type: **Web Application**
   - Name: `ChildBloom`
   - Authorized redirect URIs — add all three:
     ```
     https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
     https://childbloom-pi.vercel.app
     http://localhost:5173
     ```
4. Copy the **Client ID** and **Client Secret**
5. **Supabase Dashboard → Authentication → Providers → Google → Enable**
6. Paste the Client ID and Client Secret → Save
7. No new `.env` variables needed in the app — Supabase handles OAuth internally

> **New users** who sign in with Google are routed to onboarding automatically.
> **Returning users** skip onboarding and go directly to the dashboard.

## Voice Feature Setup

To enable high-quality Malayalam and Tamil voice output:

1. Go to console.cloud.google.com
2. Create a project or select existing
3. Search for "Cloud Text-to-Speech API" and enable it
4. Go to Credentials → Create Credentials → API Key
5. Add to Vercel: Settings → Environment Variables
   - Name: `GOOGLE_TTS_API_KEY`
   - Value: your key
   - Environment: Production + Preview + Development

Without this key, the app falls back to the browser's built-in voice synthesis automatically. The app will not crash or show errors — voice quality will just be lower until the key is added.

Free tier: 1 million characters per month (WaveNet voices).
This covers approximately 50,000 voice responses per month at no cost.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-sonnet-4-20250514` |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side) |
| `VITE_SUPABASE_URL` | Yes | Supabase URL baked into frontend build |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key baked into frontend build |
| `GOOGLE_TTS_API_KEY` | No | Google Cloud TTS — enables WaveNet Malayalam/Tamil voices |

## Stack

- **Frontend**: React 18, Vite, TailwindCSS, TanStack React Query
- **Backend**: Vercel serverless functions (`/api/`)
- **Auth + DB**: Supabase
- **AI**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **Voice input**: Web Speech API (Chrome/Edge/Android)
- **Voice output**: Google Cloud TTS (WaveNet) with browser SpeechSynthesis fallback
- **i18n**: i18next — English, Hindi, Malayalam, Tamil, Telugu, Punjabi
