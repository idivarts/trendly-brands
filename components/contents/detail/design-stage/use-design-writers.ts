/**
 * use-design-writers — the client-side writers for a content's design, with no
 * subscriptions of its own.
 *
 * Split out of use-content-design so a surface that only needs to SAVE a render
 * (the Media Stage) doesn't have to open the revision + history listeners that
 * only the Design Studio's preview and Revert actually use.
 *
 * `use-content-design` composes this, so there is still one implementation of
 * what "save a render" means.
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
    /** Store the captured slide renders as the content's attachments (one per
     *  slide, ordered) + cache the cover on the revision and designRef. */
    setRenders: (revisionId: string, renderUrls: string[]) => Promise<void>;
    /** Store the client-encoded MP4 as the content's single video attachment. */
    setVideoRender: (revisionId: string, videoUrl: string) => Promise<void>;
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

        const setRenders: DesignWriters["setRenders"] = async (rid, renderUrls) => {
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

        const setVideoRender: DesignWriters["setVideoRender"] = async (rid, videoUrl) => {
            if (!brandId || !contentId) return;
            await updateDoc(
                doc(FirestoreDB, "brands", brandId, "contents", contentId, "designs", rid),
                { renderUrl: videoUrl }
            );
            const cd = contentDoc();
            if (cd) {
                await updateDoc(cd, {
                    "designRef.renderUrl": videoUrl,
                    attachments: [{ type: "video", playUrl: videoUrl }],
                    updatedAt: Date.now(),
                });
            }
        };

        return { addRevision, setRenders, setVideoRender };
    }, [brandId, contentId]);
}
