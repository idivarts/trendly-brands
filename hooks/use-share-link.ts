import { useAuthContext } from "@/contexts/auth-context.provider";
import { BRANDS_FE_URL } from "@/shared-constants/app";
import {
    IShareLink,
    ShareType,
} from "@/shared-libs/firestore/trendly-pro/models/share-links";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import * as Crypto from "expo-crypto";
import {
    doc,
    DocumentReference,
    getDoc,
    onSnapshot,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface ShareTarget {
    type: ShareType;
    brandId: string;
    /** strategyId / contentId — omit for calendarMonth. */
    resourceId?: string;
    /** "YYYY-MM" — required for calendarMonth. */
    month?: string;
}

interface ShareLinkState {
    /** Whether a public link is currently enabled for this target. */
    enabled: boolean;
    /** The current share token (present once shared at least once). */
    token: string | null;
    /** Full public web URL, or null if never shared. */
    shareUrl: string | null;
    /**
     * Branch deep link for this share — opens the app when installed, falls back
     * to `shareUrl` in a browser, and survives an install (deferred deep link).
     * Null until it has been minted; `preferredUrl` is what UI should show.
     */
    deepLink: string | null;
    /**
     * The URL to actually hand out: the deep link when there is one, else the web
     * URL. Non-null whenever the link is enabled.
     */
    preferredUrl: string | null;
    /** True while the deep link is being fetched/minted. */
    deepLinkLoading: boolean;
    /** True while the initial source-of-truth doc is loading. */
    loading: boolean;
    /** True while an enable/disable mutation is in flight. */
    mutating: boolean;
    enable: () => Promise<string | null>;
    disable: () => Promise<void>;
}

/** The plain web URL for a token — always valid, on every platform. */
const shareUrlFor = (token: string): string => `${BRANDS_FE_URL}/share/${token}`;

/**
 * Generate an unguessable, URL-safe share token (128 hex chars ≈ 256 bits).
 */
function generateToken(): string {
    return (Crypto.randomUUID() + Crypto.randomUUID()).replace(/-/g, "");
}

/**
 * Returns the source-of-truth document reference that carries the
 * `{ enabled, token }` share state for a target:
 *   - strategy        → brands/{brandId}/strategies/{resourceId}.publicShare
 *   - content         → brands/{brandId}/contents/{resourceId}.publicShare
 *   - calendarMonth   → brands/{brandId}/calendarShares/{month}
 */
function sourceRef(target: ShareTarget): DocumentReference | null {
    const { type, brandId, resourceId, month } = target;
    if (!brandId) return null;
    if (type === "strategy" && resourceId) {
        return doc(FirestoreDB, "brands", brandId, "strategies", resourceId);
    }
    if (type === "content" && resourceId) {
        return doc(FirestoreDB, "brands", brandId, "contents", resourceId);
    }
    if (type === "calendarMonth" && month) {
        return doc(FirestoreDB, "brands", brandId, "calendarShares", month);
    }
    return null;
}

/**
 * Reads/writes the public-share state for a Strategy doc, a Content item, or a
 * Calendar month. Generating a link is idempotent: re-enabling reuses the
 * existing token so previously-copied URLs keep working.
 */
export const useShareLink = (target: ShareTarget): ShareLinkState => {
    const { manager } = useAuthContext();
    const [enabled, setEnabled] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [mutating, setMutating] = useState(false);
    const [deepLink, setDeepLink] = useState<string | null>(null);
    const [deepLinkLoading, setDeepLinkLoading] = useState(false);

    const ref = useMemo(() => sourceRef(target), [
        target.type,
        target.brandId,
        target.resourceId,
        target.month,
    ]);

    // Subscribe to the source-of-truth doc so the toggle reflects live state.
    useEffect(() => {
        if (!ref) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                const data = snap.data() as
                    | { publicShare?: { enabled?: boolean; token?: string }; enabled?: boolean; token?: string }
                    | undefined;
                // calendarShares stores {enabled, token} at the top level;
                // strategies/contents nest it under `publicShare`.
                const share =
                    target.type === "calendarMonth" ? data : data?.publicShare;
                setEnabled(!!share?.enabled);
                setToken(share?.token ?? null);
                setLoading(false);
            },
            () => setLoading(false)
        );
        return () => unsub();
    }, [ref, target.type]);

    /**
     * Resolve the Branch deep link for the live token.
     *
     * Reads `shareLinks/{token}.deepLink` first and only asks the backend to mint
     * one when it is absent, so the common case (an already-shared resource) is a
     * single doc read with no request. The backend side is idempotent too — it
     * caches onto the same field — so a race here costs at most one extra call.
     *
     * Failure is never surfaced: the web URL already works everywhere, and a
     * missing deep link only means the share sheet shows that instead.
     */
    useEffect(() => {
        // Clearing on every target change is what stops the previous resource's
        // URL from lingering on screen while the new one is fetched.
        setDeepLink(null);

        if (!enabled || !token || !target.brandId) return;

        // `cancelled` guards the late-response case: switching between two shared
        // items faster than the request completes would otherwise show the first
        // item's link against the second item.
        let cancelled = false;
        const brandId = target.brandId;

        const resolve = async () => {
            setDeepLinkLoading(true);
            try {
                const snap = await getDoc(doc(FirestoreDB, "shareLinks", token));
                if (cancelled) return;
                const cached = (snap.data() as IShareLink | undefined)?.deepLink;
                if (cached) {
                    setDeepLink(cached);
                    return;
                }

                const res = await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/share-links/${token}/deep-link`,
                    { method: "POST" }
                );
                // `deepLink` tells us whether `url` is a Branch link or the plain
                // web fallback the backend returns when Branch is unconfigured for
                // the stage or unreachable.
                const body = (await res.json()) as { url?: string; deepLink?: boolean };
                if (cancelled) return;
                setDeepLink(body?.deepLink && body.url ? body.url : null);
            } catch (error) {
                if (!cancelled) Console.error(error, "useShareLink: deep link");
            } finally {
                if (!cancelled) setDeepLinkLoading(false);
            }
        };
        void resolve();

        return () => {
            cancelled = true;
        };
    }, [enabled, token, target.brandId]);

    const writeShareLinkDoc = useCallback(
        async (shareToken: string, isEnabled: boolean) => {
            const linkRef = doc(FirestoreDB, "shareLinks", shareToken);
            const payload: Partial<IShareLink> & { updatedAt: number } = {
                type: target.type,
                brandId: target.brandId,
                enabled: isEnabled,
                createdBy: manager?.id ?? "",
                updatedAt: Date.now(),
            };
            if (target.type === "calendarMonth") {
                payload.month = target.month;
            } else {
                payload.resourceId = target.resourceId;
            }
            // createdAt only on first write (merge keeps the original).
            await setDoc(
                linkRef,
                { ...payload, createdAt: payload.updatedAt },
                { merge: true }
            );
        },
        [target.type, target.brandId, target.resourceId, target.month, manager?.id]
    );

    const enable = useCallback(async (): Promise<string | null> => {
        if (!ref) return null;
        setMutating(true);
        try {
            const shareToken = token ?? generateToken();
            // 1. Upsert the public shareLinks/{token} mapping.
            await writeShareLinkDoc(shareToken, true);
            // 2. Flag the source-of-truth doc.
            if (target.type === "calendarMonth") {
                await setDoc(
                    ref,
                    {
                        enabled: true,
                        token: shareToken,
                        brandId: target.brandId,
                        month: target.month,
                        updatedAt: Date.now(),
                    },
                    { merge: true }
                );
            } else {
                await updateDoc(ref, {
                    publicShare: { enabled: true, token: shareToken },
                });
            }
            setToken(shareToken);
            setEnabled(true);
            return shareToken;
        } finally {
            setMutating(false);
        }
    }, [ref, token, target.type, target.brandId, target.month, writeShareLinkDoc]);

    const disable = useCallback(async () => {
        if (!ref || !token) return;
        setMutating(true);
        try {
            await writeShareLinkDoc(token, false);
            if (target.type === "calendarMonth") {
                await setDoc(ref, { enabled: false }, { merge: true });
            } else {
                await updateDoc(ref, {
                    publicShare: { enabled: false, token },
                });
            }
            setEnabled(false);
        } finally {
            setMutating(false);
        }
    }, [ref, token, target.type, writeShareLinkDoc]);

    const shareUrl = token ? shareUrlFor(token) : null;

    return {
        enabled,
        token,
        shareUrl,
        deepLink,
        // The deep link is strictly better when present (opens the app, survives
        // an install); the web URL is the fallback, not a second-class option.
        preferredUrl: deepLink ?? shareUrl,
        deepLinkLoading,
        loading,
        mutating,
        enable,
        disable,
    };
};
