/**
 * use-content-composition — the content's timeline, read and written.
 *
 * A design is one self-contained HTML document, and until compositions existed
 * that was the whole of a video: one document in, one MP4 out. The timeline is
 * the primitive above it — a sequence of clips, of which a whole design may be
 * one, alongside footage, stills and generated video.
 *
 * ── The derived composition is the important part ────────────────────────────
 * `composition` is NEVER null while there is a design: when nothing has been
 * authored it is `compositionFromDesign(...)`, the same one-clip timeline the
 * render worker derives in memory for every pre-composition video. So the
 * timeline UI has something real to show from the first open, with nothing
 * written and nothing migrated, and "add a clip" is an edit to an existing
 * timeline rather than a mode the user has to enter.
 *
 * `authored` is how a caller tells the two apart — it is what decides whether
 * the content renders through its `designRef` or its `compositionRef`, and so
 * whether a timeline exists at all as far as the backend is concerned.
 *
 * ── Why the client writes these at all ───────────────────────────────────────
 * `firestore.rules` makes the `compositions` subcollection client-writable,
 * exactly like `designs`, because the timeline is composed on the device. The
 * `render*` fields are the one exception and are refused to a client: a
 * composition is only ever rendered on our own infrastructure after the wallet
 * has been charged, and `renderUrl` is what the publish gate trusts as "this
 * has been exported". So nothing here ever writes one.
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    Composition,
    CompositionProblem,
    compositionFromDesign,
    measureComposition,
    validateComposition,
    videoTrack,
    withDerivedOffsets,
} from "@/shared-libs/design/composition-runtime";
import {
    IContentCompositionRef,
    IContentCompositionRevision,
} from "@/shared-libs/firestore/trendly-pro/models/composition";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    addDoc,
    collection,
    deleteField,
    doc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Frame rate for a composition the app authors.
 *
 * The same 30 the render worker falls back to (`RENDER_FPS`), because a
 * timeline the user builds has to render at the rate every existing video
 * rendered at — a composition claiming 24 would re-time every design clip
 * inside it. It is stored rather than left to the worker so the number a render
 * is measured against is in the document that was approved.
 */
export const COMPOSITION_FPS = 30;

/** What the timeline needs to know about the design it may contain. */
export interface CompositionDesign {
    revisionId: string;
    width: number;
    height: number;
    /**
     * The design's own measured length. Prefer the frame's live measurement
     * over the stored one: the stored value is a cache, and a design edited in
     * this session is longer or shorter than the document says.
     */
    durationMs: number;
}

type Revision = IContentCompositionRevision & { id: string };

export interface UseContentCompositionReturn {
    /** The timeline as the renderer will see it. Null only without a design. */
    composition: Composition | null;
    /** True once a timeline has been authored — i.e. a revision exists. */
    authored: boolean;
    /** How many clips are on the picture track. 1 means "just the design". */
    clipCount: number;
    totalMs: number;
    revision: Revision | null;
    loading: boolean;
    saving: boolean;
    /** Why this timeline cannot render, if it cannot. Empty when it can. */
    problems: CompositionProblem[];
    /** Persist a new revision and point the content at it. */
    save: (
        next: Composition,
        origin?: IContentCompositionRevision["origin"]
    ) => Promise<string | null>;
    /** Drop the timeline. The content goes back to rendering its design. */
    discard: () => Promise<void>;
}

export function useContentComposition(
    contentId: string | null,
    compositionRef: IContentCompositionRef | undefined,
    design: CompositionDesign | null
): UseContentCompositionReturn {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;
    const revisionId = compositionRef?.revisionId;

    const [revision, setRevision] = useState<Revision | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!brandId || !contentId || !revisionId) {
            setRevision(null);
            return;
        }
        setLoading(true);
        const ref = doc(
            FirestoreDB,
            "brands",
            brandId,
            "contents",
            contentId,
            "compositions",
            revisionId
        );
        const unsub = onSnapshot(
            ref,
            (snap) => {
                setRevision(
                    snap.exists()
                        ? { id: snap.id, ...(snap.data() as IContentCompositionRevision) }
                        : null
                );
                setLoading(false);
            },
            () => setLoading(false)
        );
        return () => unsub();
    }, [brandId, contentId, revisionId]);

    /**
     * The stored timeline, or the implicit one.
     *
     * The derived branch re-reads the design's CURRENT length on every change,
     * which is what keeps an un-authored timeline honest while the design is
     * being edited. A stored one does not: its clip durations were authored,
     * and silently restretching the design clip under the user would move every
     * later clip and every overlay.
     */
    const composition = useMemo<Composition | null>(() => {
        if (revision?.composition) return revision.composition;
        if (!design) return null;
        return compositionFromDesign({
            revisionId: design.revisionId,
            width: design.width,
            height: design.height,
            fps: COMPOSITION_FPS,
            durationMs: design.durationMs,
        });
    }, [revision?.composition, design]);

    const measured = useMemo(
        () => (composition ? measureComposition(composition) : null),
        [composition]
    );

    const problems = useMemo(
        () => (composition ? validateComposition(composition) : []),
        [composition]
    );

    const save = useCallback<UseContentCompositionReturn["save"]>(
        async (next, origin = "timeline") => {
            if (!brandId || !contentId) return null;
            setSaving(true);
            try {
                // Restamped before storing, so the cached offsets in the
                // document can never contradict the runtime's arithmetic. The
                // backend recomputes them again on read anyway — they are what
                // a render is billed on — and agreeing in advance means the UI
                // and the invoice describe the same timeline.
                const stamped = withDerivedOffsets(next);
                const created = await addDoc(
                    collection(
                        FirestoreDB,
                        "brands",
                        brandId,
                        "contents",
                        contentId,
                        "compositions"
                    ),
                    {
                        composition: stamped,
                        origin,
                        parentRevisionId: revisionId ?? null,
                        createdAt: Date.now(),
                    }
                );

                const clips = videoTrack(stamped)?.clips ?? [];
                const ref: IContentCompositionRef = {
                    revisionId: created.id,
                    width: stamped.width,
                    height: stamped.height,
                    fps: stamped.fps,
                    durationMs: stamped.durationMs ?? 0,
                    clipCount: clips.length,
                    updatedAt: Date.now(),
                };
                // `renderUrl` is deliberately absent: a fresh revision has not
                // been rendered, and carrying the previous one forward would
                // tell the publish gate this timeline had been exported.
                await updateDoc(
                    doc(FirestoreDB, "brands", brandId, "contents", contentId),
                    { compositionRef: ref, updatedAt: Date.now() }
                );
                return created.id;
            } finally {
                setSaving(false);
            }
        },
        [brandId, contentId, revisionId]
    );

    const discard = useCallback(async () => {
        if (!brandId || !contentId) return;
        setSaving(true);
        try {
            // Only the POINTER is removed. The revisions stay where they are:
            // they are immutable history, and a user who drops a timeline by
            // accident has lost nothing they cannot be given back.
            await updateDoc(doc(FirestoreDB, "brands", brandId, "contents", contentId), {
                compositionRef: deleteField(),
                updatedAt: Date.now(),
            });
        } finally {
            setSaving(false);
        }
    }, [brandId, contentId]);

    return {
        composition,
        authored: !!revision,
        clipCount: measured?.clips.length ?? 0,
        totalMs: measured?.totalMs ?? 0,
        revision,
        loading,
        saving,
        problems,
        save,
        discard,
    };
}
