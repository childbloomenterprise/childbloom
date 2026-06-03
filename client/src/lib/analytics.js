// PostHog analytics — bundled SDK (NOT the inline CDN snippet).
//
// Why bundled instead of the <script> snippet in index.html?
// The production Content-Security-Policy (vercel.json) forbids inline scripts
// (`script-src 'self' …` with no 'unsafe-inline'). The old inline snippet was
// silently blocked in prod → ZERO events were ever captured. Importing the SDK
// as a module means the code ships inside our own bundle (served from 'self'),
// so it runs under the strict CSP. The CSP also whitelists the PostHog API +
// asset hosts (us.i.posthog.com / us-assets.i.posthog.com) so capture, remote
// config, and session replay all work without violations.
//
// Public API (kept stable — call sites across the app depend on these):
//   initAnalytics()                 — call once at boot (main.jsx)
//   track(event, props)             — fire a custom event (fire-and-forget)
//   identifyUser(userId, email)     — tie events to a signed-in user
//   resetAnalytics()                — clear identity on sign-out
//   capturePageview(path)           — manual SPA pageview (App.jsx route hook)

import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (typeof window === 'undefined') return;   // SSR / test node env guard
  if (!KEY) return;                            // no key (e.g. local dev) → analytics disabled, app unaffected
  try {
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: 'identified_only',  // don't create person rows for anonymous visitors (billing-friendly)
      capture_pageview: false,             // we capture pageviews manually per SPA route (see capturePageview)
      capture_pageleave: true,
      autocapture: true,
      persistence: 'localStorage+cookie',
    });
    initialized = true;
  } catch {
    // Never let analytics break the app.
  }
}

export function track(event, properties = {}) {
  try {
    if (initialized) posthog.capture(event, properties);
  } catch {}
}

export function identifyUser(userId, email) {
  try {
    if (initialized && userId) {
      posthog.identify(userId, email ? { email } : undefined);
    }
  } catch {}
}

export function resetAnalytics() {
  try {
    if (initialized) posthog.reset();
  } catch {}
}

export function capturePageview(path) {
  try {
    if (initialized) {
      posthog.capture('$pageview', path ? { $current_url: window.location.origin + path } : {});
    }
  } catch {}
}

export { posthog };
