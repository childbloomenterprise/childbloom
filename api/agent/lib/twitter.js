import { TwitterApi } from 'twitter-api-v2';

/**
 * Posts a tweet to ChildBloom's X account
 * Requires all 4 OAuth 1.0a credentials to post
 */
export async function postTweet(text) {
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  // ── ACCESS TOKEN CHECK ──────────────────────────────────────────────────────
  // You're missing TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_TOKEN_SECRET.
  // To get them:
  //   1. Go to https://developer.twitter.com/en/portal/projects-and-apps
  //   2. Open your app → Keys and Tokens
  //   3. Generate "Access Token & Secret" (make sure your app has Read+Write)
  //   4. Add them to your Vercel environment variables
  // ───────────────────────────────────────────────────────────────────────────
  if (!accessToken || !accessSecret) {
    console.warn('[Twitter] Access token missing — logging post instead of tweeting');
    console.log('[Twitter] Would have posted:', text);
    return { simulated: true, text };
  }

  const client = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken,
    accessSecret
  });

  const tweet = await client.v2.tweet(text);
  console.log('[Twitter] Posted tweet:', tweet.data.id);
  return { success: true, tweetId: tweet.data.id, text };
}
