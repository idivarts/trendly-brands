/**
 * Inbox data source — THE SEAM.
 *
 * The entire Inbox UI consumes the inbox exclusively through `useInbox()`,
 * backed by the live backend API (`useInboxApi`). Returns live data only once
 * the brand's connected IG/FB accounts have App-Review-approved messaging
 * scopes — see `backend-sls/docs/inbox-meta-permissions.md`.
 */
import { UseInboxResult } from "../types";
import { useInboxApi } from "./use-inbox.api";

export function useInbox(): UseInboxResult {
    return useInboxApi();
}
