import { corsOrigin } from './lib/models.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin());
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Robots-Tag', 'noindex');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}
