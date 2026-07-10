/**
 * use-content-design
 *
 * Subscribes to the CURRENT HTML design revision of a content
 * (brands/{brandId}/contents/{contentId}/designs/{revisionId}) and exposes
 * client-side writers. The designs subcollection is client-writable, so
 * deterministic text edits and the WebView-captured render are persisted
 * frontend-side with no backend round-trip; the AI also writes revisions via the
 * backend (Admin SDK). Revision history powers Revert.
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    DesignDocType,
    IContentDesignRef,
    IContentDesignRevision,
} from "@/shared-libs/firestore/trendly-pro/models/design";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    addDoc,
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type Revision = IContentDesignRevision & { id: string };

interface UseContentDesignReturn {
    revision: Revision | null;
    history: Revision[];
    loading: boolean;
    /** Persist a new HTML revision and point the content at it. Returns the id. */
    addRevision: (
        html: string,
        width: number,
        height: number,
        slideCount: number,
        docType: DesignDocType,
        origin: IContentDesignRevision["origin"],
        parentId?: string
    ) => Promise<string | null>;
    /** Store the frontend-captured slide renders as the content's attachments
     *  (one per slide, ordered) + cache the cover on the revision + designRef. */
    setRenders: (revisionId: string, renderUrls: string[]) => Promise<void>;
    revertTo: (revisionId: string) => Promise<void>;
}

export function useContentDesign(
    contentId: string | null,
    designRef: IContentDesignRef | undefined
): UseContentDesignReturn {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;
    const revisionId = designRef?.revisionId;

    const [revision, setRevision] = useState<Revision | null>(null);
    const [history, setHistory] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!brandId || !contentId || !revisionId) {
            setRevision(null);
            return;
        }
        setLoading(true);
        const ref = doc(FirestoreDB, "brands", brandId, "contents", contentId, "designs", revisionId);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                setRevision(snap.exists() ? ({ id: snap.id, ...(snap.data() as IContentDesignRevision) }) : null);
                setLoading(false);
            },
            () => setLoading(false)
        );
        return () => unsub();
    }, [brandId, contentId, revisionId]);

    useEffect(() => {
        if (!brandId || !contentId) {
            setHistory([]);
            return;
        }
        const q = query(
            collection(FirestoreDB, "brands", brandId, "contents", contentId, "designs"),
            orderBy("createdAt", "desc"),
            limit(15)
        );
        const unsub = onSnapshot(q, (snap) => {
            setHistory(snap.docs.map((d) => ({ id: d.id, ...(d.data() as IContentDesignRevision) })));
        });
        return () => unsub();
    }, [brandId, contentId]);

    const writers = useMemo(() => {
        const contentDoc = () =>
            brandId && contentId ? doc(FirestoreDB, "brands", brandId, "contents", contentId) : null;

        const pointContentAt = async (rev: {
            id: string;
            docType: DesignDocType;
            width: number;
            height: number;
            slideCount: number;
            renderUrl?: string;
        }) => {
            const cd = contentDoc();
            if (!cd) return;
            const ref: IContentDesignRef = {
                revisionId: rev.id,
                docType: rev.docType,
                width: rev.width,
                height: rev.height,
                slideCount: rev.slideCount,
                renderUrl: rev.renderUrl,
                updatedAt: Date.now(),
            };
            await updateDoc(cd, { designRef: ref, source: "ai", updatedAt: Date.now() });
        };

        const addRevision: UseContentDesignReturn["addRevision"] = async (
            html,
            width,
            height,
            slideCount,
            docType,
            origin,
            parentId
        ) => {
            if (!brandId || !contentId) return null;
            const col = collection(FirestoreDB, "brands", brandId, "contents", contentId, "designs");
            const created = await addDoc(col, {
                html,
                width,
                height,
                slideCount,
                docType,
                origin,
                parentRevisionId: parentId ?? null,
                createdAt: Date.now(),
            });
            await pointContentAt({ id: created.id, docType, width, height, slideCount });
            return created.id;
        };

        const setRenders: UseContentDesignReturn["setRenders"] = async (rid, renderUrls) => {
            if (!brandId || !contentId || renderUrls.length === 0) return;
            const cover = renderUrls[0];
            await updateDoc(
                doc(FirestoreDB, "brands", brandId, "contents", contentId, "designs", rid),
                { renderUrl: cover }
            );
            const cd = contentDoc();
            if (cd) {
                // One attachment per slide (ordered) — the publish pipeline treats
                // multiple image attachments as a carousel.
                await updateDoc(cd, {
                    "designRef.renderUrl": cover,
                    attachments: renderUrls.map((u) => ({ type: "image", imageUrl: u })),
                    updatedAt: Date.now(),
                });
            }
        };

        const revertTo: UseContentDesignReturn["revertTo"] = async (rid) => {
            // Re-point the content at an earlier revision (new current).
            const target = history.find((h) => h.id === rid);
            if (!target) return;
            await addRevision(target.html, target.width, target.height, target.slideCount, target.docType, "revert", rid);
        };

        return { addRevision, setRenders, revertTo };
    }, [brandId, contentId, history]);

    return { revision, history, loading, ...writers };
}
