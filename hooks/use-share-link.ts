import { useAuthContext } from "@/contexts/auth-context.provider";
import { BRANDS_FE_URL } from "@/shared-constants/app";
import {
    IShareLink,
    ShareType,
} from "@/shared-libs/firestore/trendly-pro/models/share-links";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import * as Crypto from "expo-crypto";
import {
    doc,
    DocumentReference,
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
    /** Full public URL, or null if never shared. */
    shareUrl: string | null;
    /** True while the initial source-of-truth doc is loading. */
    loading: boolean;
    /** True while an enable/disable mutation is in flight. */
    mutating: boolean;
    enable: () => Promise<string | null>;
    disable: () => Promise<void>;
}

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

    const shareUrl = token ? `${BRANDS_FE_URL}/share/${token}` : null;

    return { enabled, token, shareUrl, loading, mutating, enable, disable };
};
