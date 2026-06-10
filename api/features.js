// Multiplexed AI-feature endpoint.
//
// Vercel's Hobby plan caps a deployment at 12 Serverless Functions. The three
// retention endpoints below are the smallest, so they share ONE function here
// and are routed by the `fn` query param. `vercel.json` rewrites keep the
// original public URLs unchanged, so the client never had to change:
//
//   GET  /api/brief/today  -> /api/features?fn=brief   (api/lib/features/brief.js)
//   POST /api/myth-check   -> /api/features?fn=myth    (api/lib/features/myth.js)
//   POST /api/parse-log    -> /api/features?fn=parse   (api/lib/features/parse.js)
//   POST /api/tts          -> /api/features?fn=tts     (api/lib/features/tts.js)
//   POST /api/send-review  -> /api/features?fn=review  (api/lib/features/review.js)
//   GET  /api/health       -> /api/features?fn=health  (inline below)
//
// The real handlers live in api/lib/** and use NAMED exports (no `export
// default`), so Vercel does NOT treat them as Serverless Functions — only files
// with a default-export handler under api/ count toward the Hobby 12-function cap.

import { handler as brief } from './lib/features/brief.js';
import { handler as myth } from './lib/features/myth.js';
import { handler as parse } from './lib/features/parse.js';
import { handler as tts } from './lib/features/tts.js';
import { handler as review } from './lib/features/review.js';
import { corsOrigin } from './lib/models.js';

function health(req, res) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin());
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method === 'OPTIONS') return res.status(200).end();
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

const HANDLERS = { brief, myth, parse, tts, review, health };

export default async function handler(req, res) {
  const fn = req.query?.fn;
  const route = HANDLERS[fn];
  if (!route) {
    return res.status(404).json({ error: { message: 'Unknown feature endpoint' } });
  }
  return route(req, res);
}
