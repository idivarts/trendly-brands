/**
 * use-design-writers — the client-side writers for a content's design.
 *
 * Only ONE thing is written from here now: a new HTML revision, which is what a
 * deterministic text edit produces. Storing a render used to live here too
 * (`setRenders` / `setVideoRender`); the render worker owns that, and
 * firestore.rules blocks the client from the `render*` fields — `renderUrl` is
 * what the publish gate trusts as "this design has been exported", so a client
 * able to write it could mark an unrendered design publishable.
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    DesignDocType,
    IContentDesignRef,
    IContentDesignRevision,
} from "@/shared-libs/firestore/trendly-pro/models/design";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { useMemo } from "react";

export interface DesignWriters {
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
}

export function useDesignWriters(contentId: string | null): DesignWriters {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    return useMemo(() => {
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
                updatedAt: Date.now(),
            };
            // Firestore rejects `undefined`; only set renderUrl when the revision
            // actually has a baked cover (a fresh/reverted revision has none yet).
            if (rev.renderUrl !== undefined) ref.renderUrl = rev.renderUrl;
            await updateDoc(cd, { designRef: ref, source: "ai", updatedAt: Date.now() });
        };

        const addRevision: DesignWriters["addRevision"] = async (
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

        return { addRevision };
    }, [brandId, contentId]);
}
