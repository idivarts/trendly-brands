/**
 * The studio's live state, and every edit that changes it.
 *
 * ── How reading and writing are split ───────────────────────────────────────
 * READS come from Firestore, live: the studio document and its scenes are
 * subscribed to, so a scene the backend fills in — a generation landing, a
 * director run appending a beat — appears without the app asking. WRITES go
 * through /api/studio, because every scene write moves media reference counts
 * and those cannot be maintained correctly from a client.
 *
 * ── Why the optimistic layer exists ─────────────────────────────────────────
 * A round trip per drag would make the rail feel broken. So an edit is applied
 * to a local overlay FIRST, the call goes out, and the subscription replaces the
 * overlay when it echoes back. If the call fails the overlay is dropped and the
 * subscription's state — the truth — is what remains, so a failed reorder snaps
 * back rather than leaving the UI claiming something that did not happen.
 *
 * ⚠️ ORDER AND DURATION ARE NEVER COMPUTED HERE from local guesses. `sceneOrder`
 * on the studio is the authority on sequence, and the length comes from
 * `measureStudio`, shared with the backend and the render worker. Two places
 * that both believe they know the order is the exact bug this studio replaces.
 */
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    ICastMember,
    IStudio,
    IStudioLayer,
    IStudioScene,
    ISceneNarration,
    ITransition,
    measureStudio,
    orderedScenes,
} from "@/shared-libs/firestore/trendly-pro/models/studio";
import * as api from "@/utils/studio-api";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseStudioResult {
    studio: IStudio | null;
    /** Scenes in the studio's order. */
    scenes: IStudioScene[];
    /** The real length, after transition overlaps and narration stretches. */
    totalMs: number;
    /** Each scene's start on the timeline. */
    starts: Record<string, number>;

    loading: boolean;
    /** A sentence to show the user, or null. */
    error: string | null;
    /** True while a write is in flight, for disabling destructive controls. */
    saving: boolean;

    addScene: (input?: api.AddSceneInput) => Promise<string | null>;
    insertSceneAt: (at: number) => Promise<string | null>;
    deleteScene: (sceneId: string) => Promise<void>;
    duplicateScene: (sceneId: string) => Promise<void>;
    splitScene: (sceneId: string, atMs: number) => Promise<void>;
    reorder: (order: string[]) => Promise<void>;
    moveScene: (sceneId: string, toIndex: number) => Promise<void>;
    setLayers: (sceneId: string, layers: IStudioLayer[]) => Promise<void>;
    setDuration: (sceneId: string, durationMs: number) => Promise<void>;
    setTransition: (sceneId: string, transitionIn: ITransition) => Promise<void>;
    setNarration: (sceneId: string, narration: ISceneNarration) => Promise<void>;
    patchStudio: (input: api.PatchStudioInput) => Promise<void>;
    setCast: (cast: ICastMember[]) => Promise<string | null>;
    refresh: () => Promise<void>;
    /**
     * Fold a server response straight in.
     *
     * For the generation run, which makes its own calls and gets the same
     * whole-studio response back. Without this it would either re-fetch what
     * it already holds or wait for the subscription — and the point of
     * scene-by-scene generation is that each scene appears the instant it
     * lands.
     */
    applyState: (state: api.StudioState | null) => void;
}

export function useStudio(
    brandId: string | undefined,
    contentId: string | undefined
): UseStudioResult {
    const [studioId, setStudioId] = useState<string | null>(null);
    const [studio, setStudio] = useState<IStudio | null>(null);
    const [sceneMap, setSceneMap] = useState<Record<string, IStudioScene>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    /**
     * The optimistic overlay: a partial studio and partial scenes the UI reads
     * in preference to the subscription, until the subscription catches up.
     *
     * Held in state rather than a ref because the UI has to re-render when it
     * changes — which is the entire point of it.
     */
    const [overlayStudio, setOverlayStudio] = useState<Partial<IStudio> | null>(null);
    const [overlayScenes, setOverlayScenes] = useState<Record<string, Partial<IStudioScene>>>({});

    /** Writes in flight, so a late echo cannot clear a newer overlay. */
    const inFlight = useRef(0);

    const clearOverlay = useCallback(() => {
        // Only the LAST write clears. Two quick drags otherwise have the first
        // one's response wipe the second one's overlay, and the rail jumps
        // back for a frame.
        if (inFlight.current <= 0) {
            setOverlayStudio(null);
            setOverlayScenes({});
        }
    }, []);

    // ── Open the studio (and create one if the content has none) ────────────
    useEffect(() => {
        if (!brandId || !contentId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        api.openStudio(brandId, contentId)
            .then((state) => {
                if (cancelled) return;
                setStudioId(state.studio.id);
                setStudio(state.studio);
                const map: Record<string, IStudioScene> = {};
                for (const s of state.scenes) map[s.id] = s;
                setSceneMap(map);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setError("We couldn't open the studio. Please try again.");
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [brandId, contentId]);

    // ── Live studio document ───────────────────────────────────────────────
    useEffect(() => {
        if (!brandId || !contentId || !studioId) return;
        const ref = doc(
            FirestoreDB,
            "brands",
            brandId,
            "contents",
            contentId,
            "studios",
            studioId
        );
        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (!snap.exists()) return;
                // Spread FIRST, then the id: the stored document has no id field of
                // its own, and spreading over it would write `undefined` there.
                setStudio({ ...(snap.data() as IStudio), id: snap.id });
                clearOverlay();
            },
            // A failed subscription is not a failed studio: the open call
            // already returned its state. Losing live updates is worth a
            // console line, not an error screen over working content.
            //
            // ⚠️ It MUST be a line, though. Swallowing this silently is what
            // makes the one failure mode here unreadable: with no rules
            // deployed, reads are denied, every optimistic edit appears to
            // land and then vanishes on reload, and nothing anywhere says
            // permission-denied.
            (err) => console.warn("[studio] studio subscription lost:", err?.message ?? err)
        );
        return () => unsub();
    }, [brandId, contentId, studioId, clearOverlay]);

    // ── Live scenes ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!brandId || !contentId || !studioId) return;
        const ref = collection(
            FirestoreDB,
            "brands",
            brandId,
            "contents",
            contentId,
            "studios",
            studioId,
            "scenes"
        );
        const unsub = onSnapshot(
            ref,
            (snap) => {
                const map: Record<string, IStudioScene> = {};
                snap.forEach((d) => {
                    map[d.id] = { ...(d.data() as IStudioScene), id: d.id };
                });
                setSceneMap(map);
                clearOverlay();
            },
            (err) => console.warn("[studio] scenes subscription lost:", err?.message ?? err)
        );
        return () => unsub();
    }, [brandId, contentId, studioId, clearOverlay]);

    // ── What the UI reads: subscription state with the overlay on top ───────
    const effectiveStudio = useMemo<IStudio | null>(() => {
        if (!studio) return null;
        return overlayStudio ? { ...studio, ...overlayStudio } : studio;
    }, [studio, overlayStudio]);

    const effectiveScenes = useMemo<Record<string, IStudioScene>>(() => {
        if (!Object.keys(overlayScenes).length) return sceneMap;
        const out: Record<string, IStudioScene> = { ...sceneMap };
        for (const [id, patch] of Object.entries(overlayScenes)) {
            if (out[id]) out[id] = { ...out[id], ...patch };
        }
        return out;
    }, [sceneMap, overlayScenes]);

    const measured = useMemo(() => {
        if (!effectiveStudio) {
            return { totalMs: 0, starts: {} as Record<string, number>, scenes: [] as IStudioScene[] };
        }
        // measureStudio is shared with the backend and the render worker, so
        // the rail, the quote and the export cannot disagree about how long
        // this is.
        return measureStudio(effectiveStudio, effectiveScenes);
    }, [effectiveStudio, effectiveScenes]);

    // ── Writes ─────────────────────────────────────────────────────────────

    /**
     * Run a mutation with an optimistic overlay in place.
     *
     * The overlay is dropped on BOTH outcomes. On success the subscription has
     * the truth; on failure the subscription still has the truth, which is the
     * state before the edit — so a failed reorder snaps back instead of leaving
     * the UI claiming something that did not happen.
     */
    const run = useCallback(
        async <T>(
            optimistic: () => void,
            fn: () => Promise<T>,
            failure: string
        ): Promise<T | null> => {
            if (!brandId || !contentId || !studioId) return null;
            inFlight.current += 1;
            setSaving(true);
            setError(null);
            optimistic();
            try {
                const out = await fn();
                return out;
            } catch {
                setError(failure);
                setOverlayStudio(null);
                setOverlayScenes({});
                return null;
            } finally {
                inFlight.current -= 1;
                if (inFlight.current <= 0) setSaving(false);
            }
        },
        [brandId, contentId, studioId]
    );

    const applyState = useCallback((state: api.StudioState | null) => {
        if (!state) return;
        setStudio(state.studio);
        const map: Record<string, IStudioScene> = {};
        for (const s of state.scenes) map[s.id] = s;
        setSceneMap(map);
    }, []);

    const addScene = useCallback(
        async (input: api.AddSceneInput = {}) => {
            const state = await run(
                () => undefined,
                () => api.addScene(brandId!, contentId!, studioId!, input),
                "We couldn't add that scene."
            );
            applyState(state);
            if (!state) return null;
            // The new scene is whichever id the response has that we did not.
            const known = new Set(Object.keys(sceneMap));
            const added = state.scenes.find((s) => !known.has(s.id));
            return added?.id ?? null;
        },
        [run, applyState, brandId, contentId, studioId, sceneMap]
    );

    const insertSceneAt = useCallback((at: number) => addScene({ at }), [addScene]);

    const deleteScene = useCallback(
        async (sceneId: string) => {
            const order = (effectiveStudio?.sceneOrder ?? []).filter((id) => id !== sceneId);
            const state = await run(
                () => setOverlayStudio({ sceneOrder: order }),
                () => api.deleteScene(brandId!, contentId!, studioId!, sceneId),
                "We couldn't delete that scene."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId, effectiveStudio]
    );

    const duplicateScene = useCallback(
        async (sceneId: string) => {
            const state = await run(
                () => undefined,
                () => api.duplicateScene(brandId!, contentId!, studioId!, sceneId),
                "We couldn't duplicate that scene."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId]
    );

    const splitScene = useCallback(
        async (sceneId: string, atMs: number) => {
            const state = await run(
                () => undefined,
                () => api.splitScene(brandId!, contentId!, studioId!, sceneId, atMs),
                "We couldn't split that scene."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId]
    );

    const reorder = useCallback(
        async (order: string[]) => {
            const state = await run(
                () => setOverlayStudio({ sceneOrder: order }),
                () => api.reorderScenes(brandId!, contentId!, studioId!, order),
                "We couldn't reorder the scenes."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId]
    );

    /** Move one scene to a position. The rail's drag calls this. */
    const moveScene = useCallback(
        async (sceneId: string, toIndex: number) => {
            const current = effectiveStudio?.sceneOrder ?? [];
            const from = current.indexOf(sceneId);
            if (from < 0) return;
            const next = [...current];
            next.splice(from, 1);
            next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, sceneId);
            await reorder(next);
        },
        [effectiveStudio, reorder]
    );

    const setLayers = useCallback(
        async (sceneId: string, layers: IStudioLayer[]) => {
            const state = await run(
                () => setOverlayScenes((o) => ({ ...o, [sceneId]: { ...o[sceneId], layers } })),
                () => api.setSceneLayers(brandId!, contentId!, studioId!, sceneId, layers),
                "We couldn't change that scene."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId]
    );

    const setDuration = useCallback(
        async (sceneId: string, durationMs: number) => {
            const state = await run(
                () => setOverlayScenes((o) => ({ ...o, [sceneId]: { ...o[sceneId], durationMs } })),
                () => api.patchScene(brandId!, contentId!, studioId!, sceneId, { durationMs }),
                "We couldn't change that scene's length."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId]
    );

    const setTransition = useCallback(
        async (sceneId: string, transitionIn: ITransition) => {
            const state = await run(
                () => setOverlayScenes((o) => ({ ...o, [sceneId]: { ...o[sceneId], transitionIn } })),
                () => api.patchScene(brandId!, contentId!, studioId!, sceneId, { transitionIn }),
                "We couldn't change that transition."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId]
    );

    const setNarration = useCallback(
        async (sceneId: string, narration: ISceneNarration) => {
            const state = await run(
                () => setOverlayScenes((o) => ({ ...o, [sceneId]: { ...o[sceneId], narration } })),
                () => api.patchScene(brandId!, contentId!, studioId!, sceneId, { narration }),
                "We couldn't change that narration."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId]
    );

    const patchStudio = useCallback(
        async (input: api.PatchStudioInput) => {
            const state = await run(
                () => setOverlayStudio((o) => ({ ...(o ?? {}), ...input } as Partial<IStudio>)),
                () => api.patchStudio(brandId!, contentId!, studioId!, input),
                "We couldn't change that setting."
            );
            applyState(state);
        },
        [run, applyState, brandId, contentId, studioId]
    );

    /**
     * Replace the cast.
     *
     * Returns the refusal message rather than swallowing it: the backend
     * refuses a member with no `look`, and that refusal is the explanation of
     * why the field matters — it belongs in front of the user, not in a log.
     */
    const setCast = useCallback(
        async (cast: ICastMember[]): Promise<string | null> => {
            if (!brandId || !contentId || !studioId) return null;
            setSaving(true);
            try {
                applyState(await api.setCast(brandId, contentId, studioId, cast));
                return null;
            } catch (e) {
                const err = e as { data?: { message?: string } };
                return err?.data?.message ?? "We couldn't save the cast.";
            } finally {
                setSaving(false);
            }
        },
        [applyState, brandId, contentId, studioId]
    );

    const refresh = useCallback(async () => {
        if (!brandId || !contentId || !studioId) return;
        try {
            applyState(await api.getStudio(brandId, contentId, studioId));
        } catch {
            // A failed refresh leaves the live subscription in charge, which is
            // the same state it was already in.
        }
    }, [applyState, brandId, contentId, studioId]);

    return {
        studio: effectiveStudio,
        scenes: effectiveStudio ? orderedScenes(effectiveStudio, effectiveScenes) : [],
        totalMs: measured.totalMs,
        starts: measured.starts,
        loading,
        error,
        saving,
        addScene,
        insertSceneAt,
        deleteScene,
        duplicateScene,
        splitScene,
        reorder,
        moveScene,
        setLayers,
        setDuration,
        setTransition,
        setNarration,
        patchStudio,
        setCast,
        refresh,
        applyState,
    };
}
