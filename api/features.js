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
//
// The real handlers live in api/lib/** which Vercel does NOT count as functions.

import brief from './lib/features/brief.js';
import myth from './lib/features/myth.js';
import parse from './lib/features/parse.js';

const HANDLERS = { brief, myth, parse };

export default async function handler(req, res) {
  const fn = req.query?.fn;
  const route = HANDLERS[fn];
  if (!route) {
    return res.status(404).json({ error: { message: 'Unknown feature endpoint' } });
  }
  return route(req, res);
}
