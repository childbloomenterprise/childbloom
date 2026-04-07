const VOICE_MAP = {
  ml: { languageCode: 'ml-IN', name: 'ml-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  ta: { languageCode: 'ta-IN', name: 'ta-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  en: { languageCode: 'en-IN', name: 'en-IN-Wavenet-A', ssmlGender: 'FEMALE' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { text, language } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 5000) {
    return res.status(400).json({ error: 'invalid_input' });
  }

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
