import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the posthog-js SDK so tests never touch the network.
const mockPosthog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
};
vi.mock('posthog-js', () => ({ default: mockPosthog }));

// Helper: load a fresh copy of analytics.js with a given env, after resetting mocks.
async function loadAnalytics({ key } = {}) {
  vi.resetModules();
  Object.values(mockPosthog).forEach((fn) => fn.mockClear());
  if (key === undefined) vi.stubEnv('VITE_POSTHOG_KEY', '');
  else vi.stubEnv('VITE_POSTHOG_KEY', key);
  return import('./analytics.js');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('analytics — disabled (no key)', () => {
  let a;
  beforeEach(async () => { a = await loadAnalytics({ key: '' }); a.initAnalytics(); });

  it('does not initialise PostHog when the key is missing', () => {
    expect(mockPosthog.init).not.toHaveBeenCalled();
  });

  it('track / identify / reset are safe no-ops when disabled', () => {
    a.track('sign_up', { method: 'email' });
    a.identifyUser('u1', 'a@b.com');
    a.resetAnalytics();
    a.capturePageview('/dashboard');
    expect(mockPosthog.capture).not.toHaveBeenCalled();
    expect(mockPosthog.identify).not.toHaveBeenCalled();
    expect(mockPosthog.reset).not.toHaveBeenCalled();
  });
});

describe('analytics — enabled (key present)', () => {
  let a;
  beforeEach(async () => { a = await loadAnalytics({ key: 'phc_test_key' }); a.initAnalytics(); });

  it('initialises PostHog once with the expected config', () => {
    expect(mockPosthog.init).toHaveBeenCalledTimes(1);
    const [key, opts] = mockPosthog.init.mock.calls[0];
    expect(key).toBe('phc_test_key');
    expect(opts.api_host).toBe('https://us.i.posthog.com');
    expect(opts.person_profiles).toBe('identified_only');
    expect(opts.capture_pageview).toBe(false); // SPA pageviews are manual
  });

  it('is idempotent — calling initAnalytics again does not re-init', () => {
    a.initAnalytics();
    expect(mockPosthog.init).toHaveBeenCalledTimes(1);
  });

  it('track() forwards event + properties to posthog.capture', () => {
    a.track('dr_bloom_message_sent', { language: 'hi' });
    expect(mockPosthog.capture).toHaveBeenCalledWith('dr_bloom_message_sent', { language: 'hi' });
  });

  it('identifyUser() passes email as a person property', () => {
    a.identifyUser('user-123', 'parent@example.com');
    expect(mockPosthog.identify).toHaveBeenCalledWith('user-123', { email: 'parent@example.com' });
  });

  it('identifyUser() ignores a falsy userId', () => {
    a.identifyUser('', 'x@y.com');
    expect(mockPosthog.identify).not.toHaveBeenCalled();
  });

  it('resetAnalytics() clears identity', () => {
    a.resetAnalytics();
    expect(mockPosthog.reset).toHaveBeenCalledTimes(1);
  });

  it('capturePageview() sends a $pageview with the absolute URL', () => {
    a.capturePageview('/child/42/growth');
    expect(mockPosthog.capture).toHaveBeenCalledWith(
      '$pageview',
      { $current_url: window.location.origin + '/child/42/growth' },
    );
  });

  it('track() never throws even if posthog.capture blows up', () => {
    mockPosthog.capture.mockImplementationOnce(() => { throw new Error('boom'); });
    expect(() => a.track('x')).not.toThrow();
  });
});
