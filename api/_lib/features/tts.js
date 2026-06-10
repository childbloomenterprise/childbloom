// POST /api/tts (rewritten to /api/features?fn=tts — see vercel.json).
// Named export so this file does NOT count toward the Hobby 12-function cap.
import { createClient } from '@supabase/supabase-js';
import { corsOrigin } from '../models.js';
import { checkRateLimit, logUsage } from '../rateLimit.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const VOICE_MAP = {
  ml: { languageCode: 'ml-IN', name: 'ml-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  ta: { languageCode: 'ta-IN', name: 'ta-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  en: { languageCode: 'en-IN', name: 'en-IN-Wavenet-A', ssmlGender: 'FEMALE' },
};

const TTS_RATE_TIERS = [
  { limit: 10,  windowSec: 60,    message: 'Slow down — TTS limit of 10 per minute reached.' },
  { limit: 60,  windowSec: 3600,  message: 'TTS hourly limit reached. Try again later.' },
  { limit: 200, windowSec: 86400, message: 'TTS daily limit reached.' },
];

export async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin());
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  // Require auth — TTS calls cost real money per request.
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { text, language } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 2000) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  if (language && (typeof language !== 'string' || language.length > 8)) {
    return res.status(400).json({ error: 'invalid_language' });
  }

  // Rate limit
  const limited = await checkRateLimit(supabase, user.id, 'tts', TTS_RATE_TIERS);
  if (limited) {
    res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: 'rate_limit', message: limited.message });
  }
  logUsage(supabase, user.id, 'tts');

  const voice = VOICE_MAP[language] || VOICE_MAP.en;

  if (!process.env.GOOGLE_TTS_API_KEY) {
    return res.status(503).json({ error: 'tts_unavailable' });
  }

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_TTS_API_KEY,
        },
        body: JSON.stringify({
          input: { text },
          voice,
          audioConfig: { audioEncoding: 'MP3' },
        }),
      }
    );

    if (!response.ok) {
      return res.status(503).json({ error: 'tts_unavailable' });
    }

    const data = await response.json();
    return res.status(200).json({ audioContent: data.audioContent });
  } catch {
    return res.status(503).json({ error: 'tts_unavailable' });
  }
}
