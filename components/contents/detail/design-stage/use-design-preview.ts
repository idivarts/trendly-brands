/**
 * use-design-preview — read-only subscription to a content's CURRENT design
 * revision, for previewing the canvas outside the Design Studio.
 *
 * The Media Stage needs this because a design only becomes an `attachment` when
 * it is rendered: between "the AI wrote a design" and "the user pressed Render"
 * the canvas exists with full HTML but the content has no media, so without the
 * live HTML the Media Stage cannot show what was just created.
 *
 * Deliberately NOT `use-content-design`: that one also subscribes to the whole
 * revision history to power Revert, which a preview has no use for.
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    DesignDocType,
    IContentDesignRef,
    IContentDesignRevision,
} from "@/shared-libs/firestore/trendly-pro/models/design";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export interface DesignPreview {
    html: string;
    width: number;
    height: number;
    slideCount: number;
    /**
     * Set once THIS revision has been rendered. The single signal that separates
     * "a design exists" from "a publishable asset exists": `setRenders` writes it
     * onto the revision doc, and `designRef.revisionId` points at the current
     * one — so an empty `renderUrl` means what you're looking at has never been
     * exported, even when the content still carries attachments from an earlier
     * revision (i.e. a stale render that would publish the wrong version).
     */
    renderUrl?: string;
    docType: DesignDocType;
}

export function useDesignPreview(
    contentId: string | null,
    designRef: IContentDesignRef | undefined
): DesignPreview | null {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;
    const revisionId = designRef?.revisionId;

    const [preview, setPreview] = useState<DesignPreview | null>(null);

    useEffect(() => {
        if (!brandId || !contentId || !revisionId) {
            setPreview(null);
            return;
        }
        const ref = doc(FirestoreDB, "brands", brandId, "contents", contentId, "designs", revisionId);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (!snap.exists()) {
                    setPreview(null);
                    return;
                }
                const d = snap.data() as IContentDesignRevision;
                setPreview(
                    d.html
                        ? {
                            html: d.html,
                            width: d.width || 1080,
                            height: d.height || 1350,
                            slideCount: Math.max(d.slideCount ?? 1, 1),
                            renderUrl: d.renderUrl,
                            docType: d.docType ?? "image",
                        }
                        : null
                );
            },
            () => setPreview(null)
        );
        return () => unsub();
    }, [brandId, contentId, revisionId]);

    return preview;
}
