import { usePublicContext } from "@/contexts/public-context-provider";
import { IShareLink } from "@/shared-libs/firestore/trendly-pro/models/share-links";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * Access tier of whoever opened a public share link:
 *   - "anon"   → logged out (anonymous Firebase session)
 *   - "guest"  → logged in, NOT a member of the share's brand
 *   - "member" → logged in AND a member of the share's brand
 */
export type ShareTier = "anon" | "guest" | "member";

export type PublicShareStatus = "loading" | "ok" | "notfound";

export interface PublicShareState {
    status: PublicShareStatus;
    share: (IShareLink & { token: string }) | null;
    tier: ShareTier;
    /** Real (non-anonymous) viewer uid, or null for anonymous viewers. */
    viewerId: string | null;
    /** Display name for the viewer (used when posting guest comments). */
    viewerName: string | null;
}

/**
 * Resolves a `shareLinks/{token}` doc and determines the viewer's access tier.
 * Returns `notfound` when the link doesn't exist or has been disabled.
 */
export const usePublicShare = (token: string | undefined): PublicShareState => {
    const { isLoading: publicLoading } = usePublicContext();
    const [state, setState] = useState<PublicShareState>({
        status: "loading",
        share: null,
        tier: "anon",
        viewerId: null,
        viewerName: null,
    });

    useEffect(() => {
        let cancelled = false;
        if (publicLoading) return;

        const resolve = async () => {
            if (!token) {
                if (!cancelled) setState((s) => ({ ...s, status: "notfound" }));
                return;
            }
            try {
                // 1. Resolve the share link.
                const linkSnap = await getDoc(doc(FirestoreDB, "shareLinks", token));
                const link = linkSnap.data() as IShareLink | undefined;
                if (!linkSnap.exists() || !link || link.enabled !== true) {
                    if (!cancelled) setState((s) => ({ ...s, status: "notfound" }));
                    return;
                }

                // 2. Determine the viewer tier.
                const current = AuthApp.currentUser;
                const isReal = !!current && !current.isAnonymous;
                let tier: ShareTier = "anon";
                let viewerId: string | null = null;
                let viewerName: string | null = null;

                if (isReal && current) {
                    viewerId = current.uid;
                    // Member iff a member doc exists under the share's brand.
                    const memberSnap = await getDoc(
                        doc(FirestoreDB, "brands", link.brandId, "members", current.uid)
                    );
                    tier = memberSnap.exists() ? "member" : "guest";
                    // Pull a display name for comment authorship.
                    const mgrSnap = await getDoc(doc(FirestoreDB, "managers", current.uid));
                    viewerName =
                        (mgrSnap.data() as { name?: string } | undefined)?.name ??
                        current.displayName ??
                        "Guest";
                }

                if (!cancelled) {
                    setState({
                        status: "ok",
                        share: { ...link, token },
                        tier,
                        viewerId,
                        viewerName,
                    });
                }
            } catch {
                if (!cancelled) setState((s) => ({ ...s, status: "notfound" }));
            }
        };

        resolve();
        return () => {
            cancelled = true;
        };
    }, [token, publicLoading]);

    return state;
};
