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

/**
 * LINKEDIN_PAGE_ENABLED gates only the LinkedIn Page (Company/Showcase Page)
 * integration — NOT personal LinkedIn, which stays enabled. Company Page
 * access requires LinkedIn's Community Management API app review, which is
 * taking too long, so this is PAUSED until that review clears. While false,
 * LinkedIn Page never appears as a connectable / publishable / inbox channel.
 *
 * To enable: flip this to true AND the backend flag
 * (backend-sls `internal/constants/features.go` LinkedInPageEnabled) and the
 * connect portal flag (trendly-connect `lib/config.ts` LINKEDIN_PAGE_ENABLED).
 */
export const LINKEDIN_PAGE_ENABLED = false;
