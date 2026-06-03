/**
 * Inbox data source — THE SEAM.
 *
 * The entire Inbox UI consumes the inbox exclusively through `useInbox()`.
 * It is now backed by the live backend API (`useInboxApi`).
 *
 * `USE_MOCK_INBOX` flips back to the in-memory mock layer for offline demos /
 * stakeholder reviews before Meta App Review is granted (the live API returns
 * real data only once the connected accounts have approved messaging scopes).
 * When the mock is no longer needed, set this to `false` permanently and delete
 * the `../mock` folder + the dev state-switcher (see ../README.md).
 */
import { useInboxMock } from "../mock/use-inbox-mock";
import { UseInboxResult } from "../types";
import { useInboxApi } from "./use-inbox.api";

/** Toggle: true = in-memory mock (offline demo), false = live backend API. */
export const USE_MOCK_INBOX = false;

export function useInbox(): UseInboxResult {
    // Both hooks are called unconditionally is NOT allowed (rules of hooks),
    // so we branch on a compile-time constant — only one hook is ever mounted
    // for a given build.
    if (USE_MOCK_INBOX) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useInboxMock();
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useInboxApi();
}
