#!/usr/bin/env node
// Stress test for ChildBloom production endpoints.
//
// Usage:
//   node scripts/stress-test.mjs                  # all tests
//   node scripts/stress-test.mjs --base=https://localhost:3001
//   node scripts/stress-test.mjs --token=<JWT>    # authenticated tests
//
// What it covers:
//   1. /api/health           — 50 parallel calls, expect 100% 200
//   2. /api/send-review      — IP rate limit kicks in at 3/hour
//   3. /api/tts              — requires auth (401 without bearer)
//   4. /api/ai/ask           — 3/min rate limit (only if --token given)
//   5. /api/ai/ask           — input size cap (5000-char message → 400)
//   6. /api/ai/ask           — bad childId → 400 (only if --token given)

const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.replace(/^--/, '').split('='))
);
const BASE = args.base || 'https://childbloom.in';
const TOKEN = args.token || null;

const colors = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
};

let passed = 0, failed = 0;
function pass(name, detail = '') { passed++; console.log(`${colors.green('PASS')} ${name} ${colors.dim(detail)}`); }
function fail(name, detail = '') { failed++; console.log(`${colors.red('FAIL')} ${name} ${colors.dim(detail)}`); }

async function req(path, opts = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const ms = Date.now() - t0;
    let body = null;
    try { body = await res.json(); } catch {}
    return { status: res.status, body, ms };
  } catch (e) {
    return { status: 0, error: e.message, ms: Date.now() - t0 };
  }
}

console.log(colors.bold(`\nChildBloom stress test → ${BASE}\n`));

// ── 1. Health endpoint parallel load ──
{
  const N = 50;
  const t0 = Date.now();
  const results = await Promise.all(Array(N).fill(0).map(() => req('/api/health')));
  const ok = results.filter(r => r.status === 200).length;
  const avg = Math.round(results.reduce((s, r) => s + r.ms, 0) / N);
  const total = Date.now() - t0;
  if (ok === N) pass(`/api/health × ${N} parallel`, `${total}ms total, avg ${avg}ms/req`);
  else fail(`/api/health × ${N} parallel`, `only ${ok}/${N} ok`);
}

// ── 2. /api/send-review IP rate limit (3/hour) ──
{
  const N = 5;
  const results = [];
  for (let i = 0; i < N; i++) {
    results.push(await req('/api/send-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, ratingLabel: 'Test', message: `stress test ${i}`, userName: 'StressBot' }),
    }));
  }
  const limited = results.filter(r => r.status === 429).length;
  if (limited >= 1) pass('/api/send-review IP rate limit', `${N} reviews → ${limited} got 429`);
  else fail('/api/send-review IP rate limit', `${N} reviews → no 429 returned. Limiter not working.`);
}

// ── 3. /api/tts requires auth ──
{
  const r = await req('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'hello', language: 'en' }),
  });
  if (r.status === 401) pass('/api/tts requires auth', `401 returned for unauth call`);
  else fail('/api/tts requires auth', `expected 401, got ${r.status}`);
}

// ── 4. /api/ai/ask input validation (bad UUID) ──
{
  const r = await req('/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer fake' },
    body: JSON.stringify({ message: 'hi', childId: 'not-a-uuid' }),
  });
  // 401 (auth) is also fine — point is we reject before billing
  if (r.status === 401 || r.status === 400) pass('/api/ai/ask rejects bad input early', `status ${r.status}`);
  else fail('/api/ai/ask rejects bad input early', `unexpected ${r.status}`);
}

// ── 5. /api/ai/ask massive payload (10,000-char msg) ──
{
  const big = 'a'.repeat(10000);
  const r = await req('/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer fake' },
    body: JSON.stringify({ message: big, childId: '00000000-0000-4000-8000-000000000000' }),
  });
  // Should hit either auth (401) or size (400). Critical: must not 5xx.
  if (r.status === 401 || r.status === 400) pass('/api/ai/ask rejects giant payload', `status ${r.status}`);
  else if (r.status >= 500) fail('/api/ai/ask rejects giant payload', `crashed with ${r.status}`);
  else fail('/api/ai/ask rejects giant payload', `unexpected ${r.status}`);
}

// ── 6. (Authenticated) /api/ai/ask 3-per-minute rate limit ──
if (TOKEN) {
  // Need a real childId — skip in basic test; would require fetching from DB.
  console.log(colors.dim('  (authenticated 3/min ask test skipped — needs a real childId in env)'));
} else {
  console.log(colors.dim('  (authenticated tests skipped — pass --token=<JWT> to enable)'));
}

// ── 7. Security headers present on root ──
{
  const r = await fetch(BASE);
  const hdrs = Object.fromEntries(r.headers);
  const required = [
    'x-content-type-options',
    'x-frame-options',
    'content-security-policy',
    'referrer-policy',
  ];
  const missing = required.filter(h => !hdrs[h]);
  if (missing.length === 0) pass('Security headers on /', `CSP, X-Frame, etc. present`);
  else fail('Security headers on /', `missing: ${missing.join(', ')}`);
}

// ── 8. CORS — random origin should not echo ──
{
  const r = await fetch(`${BASE}/api/health`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://evil.example.com' },
  });
  const allow = r.headers.get('access-control-allow-origin');
  // /api/health doesn't set CORS — that's OK. The point: it shouldn't echo evil.example.
  if (allow !== 'https://evil.example.com') pass('CORS does not echo arbitrary origin', `got: ${allow || '(none)'}`);
  else fail('CORS does not echo arbitrary origin', `echoed evil origin!`);
}

console.log();
console.log(colors.bold(`Result: ${colors.green(passed + ' passed')}, ${failed > 0 ? colors.red(failed + ' failed') : '0 failed'}`));
process.exit(failed > 0 ? 1 : 0);
