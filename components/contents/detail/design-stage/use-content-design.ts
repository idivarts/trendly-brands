/**
 * use-content-design
 *
 * Subscribes to the CURRENT HTML design revision of a content
 * (brands/{brandId}/contents/{contentId}/designs/{revisionId}) and exposes the
 * client-side writer. The designs subcollection is client-writable, so a
 * deterministic text edit is persisted with no backend round-trip; the AI also
 * writes revisions via the backend (Admin SDK), and the render worker owns
 * every `render*` field. Revision history powers Revert.
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    DesignDocType,
    IContentDesignRef,
    IContentDesignRevision,
} from "@/shared-libs/firestore/trendly-pro/models/design";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useDesignWriters } from "./use-design-writers";
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

    const writers = useDesignWriters(contentId);

    // Revert stays here: it is the one writer that needs the history listener.
    const revertTo: UseContentDesignReturn["revertTo"] = useMemo(
        () => async (rid) => {
            const target = history.find((h) => h.id === rid);
            if (!target) return;
            await writers.addRevision(
                target.html,
                target.width,
                target.height,
                target.slideCount,
                target.docType,
                "revert",
                rid
            );
        },
        [history, writers]
    );

    return { revision, history, loading, ...writers, revertTo };
}
