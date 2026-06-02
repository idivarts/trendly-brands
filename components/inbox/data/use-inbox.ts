/**
 * Inbox data source — THE SEAM.
 *
 * The entire Inbox UI consumes the inbox exclusively through `useInbox()`.
 * Right now it is fulfilled by the in-memory mock layer. To go live, replace
 * the body of this hook with a real backend-backed implementation that returns
 * the same `UseInboxResult` contract (see `../types.ts`), then delete the
 * `../mock` folder and the dev state-switcher.
 *
 * 👉 Full removal steps: components/inbox/README.md
 */
import { UseInboxResult } from "../types";
import { useInboxMock } from "../mock/use-inbox-mock";

export function useInbox(): UseInboxResult {
    // ── MOCK IMPLEMENTATION (remove when wiring the real backend) ──
    return useInboxMock();

    // ── REAL IMPLEMENTATION (sketch) ────────────────────────────
    // const { selectedBrand } = useBrandContext();
    // const { data, isLoading } = useQuery(["inbox", selectedBrand?.id], () =>
    //     fetchInbox(selectedBrand!.id)
    // );
    // return {
    //     loading: isLoading,
    //     connectedAccounts: data?.accounts ?? [],
    //     conversations: data?.conversations ?? [],
    //     sendReply: (id, text) => postReply(selectedBrand!.id, id, text),
    //     setCommentHidden: (id, hidden) => patchComment(selectedBrand!.id, id, { hidden }),
    //     deleteComment: (id) => removeComment(selectedBrand!.id, id),
    //     markRead: (id) => patchConversation(selectedBrand!.id, id, { unread: false }),
    // };
}
