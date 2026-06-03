import { PostHog } from 'posthog-node';

let _client;

function getClient() {
  if (!_client) {
    _client = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

export function track(distinctId, event, properties = {}) {
  if (!process.env.POSTHOG_API_KEY) return;
  const client = getClient();
  client.capture({ distinctId: distinctId || 'anonymous', event, properties });
}

export function identify(distinctId, userProperties = {}) {
  if (!process.env.POSTHOG_API_KEY) return;
  const client = getClient();
  client.identify({ distinctId, properties: userProperties });
}
