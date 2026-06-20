import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { useSidebarCollapsed } from "./sidebar-collapsed-context";

/**
 * Applies a one-shot sidebar state from a `sidebar` route param
 * ("collapsed" | "expanded"). Used by destinations the /onboarding flow routes
 * into so the rail starts in the right state — the onboarding screen lives
 * outside the drawer and can't set this itself. Applied once per navigation so
 * it never fights the user's later manual toggle.
 */
export function useSidebarParam() {
    const { sidebar } = useLocalSearchParams<{ sidebar?: string }>();
    const { setCollapsed } = useSidebarCollapsed();
    const applied = useRef(false);

    useEffect(() => {
        if (applied.current || !sidebar) return;
        applied.current = true;
        if (sidebar === "collapsed") setCollapsed(true);
        else if (sidebar === "expanded") setCollapsed(false);
        // setCollapsed intentionally omitted from deps — apply strictly once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sidebar]);
}
