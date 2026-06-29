/**
 * Feature flags for in-progress integrations.
 *
 * REDDIT_ENABLED gates the entire Reddit integration in the brand app (connect
 * tile, publishable destinations, inbox channels). It is built end-to-end but
 * PAUSED until the Reddit app + commercial Data API access are set up — see
 * backend-sls/docs/reddit-integration-setup.md. While false, Reddit never
 * appears as a connectable / publishable / inbox channel.
 *
 * To enable: flip this to true AND the backend flag
 * (backend-sls `internal/constants/features.go` RedditEnabled) and the connect
 * portal flag (trendly-connect `lib/config.ts` REDDIT_ENABLED).
 */
export const REDDIT_ENABLED = false;
