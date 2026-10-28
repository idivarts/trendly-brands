import type { SocialEntryPoint } from "@/shared-constants/analytics-events";
import { track } from "@/shared-libs/utils/analytics";
import { router, type Href } from "expo-router";

/**
 * The single way to reach Connected Accounts from a connect prompt.
 *
 * Same shape as `goToBilling`, for the same reason: five different doors push
 * to this screen (the inbox empty state, the blocked publish, the publish
 * reconnect, the analytics empty state, the menu) and none of them recorded
 * the click. It also carries `?from=` so the screen — and, via the stashed
 * attempt, the OAuth callback long after this navigation — can say which door
 * the user came through.
 *
 * The menu is deliberately NOT routed through here: its taps are already
 * covered by `menu_item_clicked`, and double-reporting them would make the
 * menu look like a connect prompt.
 */
export const goToConnectedAccounts = (entryPoint: SocialEntryPoint): void => {
    track("social_connect_prompt_clicked", { entry_point: entryPoint });
    router.push(`/connected-accounts?from=${entryPoint}` as Href);
};
