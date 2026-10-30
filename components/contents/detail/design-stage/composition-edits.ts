/**
 * composition-edits — every change the timeline UI can make to a composition,
 * as pure functions.
 *
 * Kept out of the components for one reason: these are the operations that
 * decide what gets rendered and what gets charged, and they are worth testing
 * without mounting anything. The components below them hold no timeline
 * arithmetic at all — they call these and hand the result to `save`.
 *
 * Nothing here mutates. A composition is persisted as an immutable revision, so
 * an edit is a new object, and an in-place change would also silently defeat
 * React's own change detection.
 *
 * The ARITHMETIC lives in `shared-libs/design/composition-runtime` and is not
 * duplicated here: offsets stay derived, the half-clamp on a transition stays
 * where both the app and the render worker read it. What this file owns is the
 * question "what does this edit mean", which is a product decision — the
 * minimum a clip may be trimmed to, what a new clip's length should be, whether
 * trimming footage changes how long it is on screen.
 */
import {
    Clip,
    ClipSource,
    Composition,
    CompositionTransitionKind,
    DEFAULT_CLIP_MS,
    DEFAULT_TRANSITION_MS,
    FootageClipSource,
    Track,
    TrackKind,
    measureOverlays,
    videoTrack,
    withDerivedOffsets,
} from "@/shared-libs/design/composition-runtime";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";

/**
 * The shortest a clip may be.
 *
 * Two frames at 30fps. Not one: a cross-fade needs something to fade, and the
 * runtime's half-clamp would reduce a one-frame clip's transition to zero and
 * silently turn a fade the user asked for into a cut.
 */
export const MIN_CLIP_MS = 67;

/**
 * How long a still is on screen when it is dropped on the timeline.
 *
 * The same default a design scene gets, so a photo and a scene read as peers
 * rather than one of them arriving mysteriously longer.
 */
export const DEFAULT_IMAGE_CLIP_MS = DEFAULT_CLIP_MS;

/** A clip id that is stable within the composition and unique across edits. */
export function newClipId(): string {
    return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export interface FoundClip {
    clip: Clip;
    track: TrackKind;
    /** Index within that track. */
    index: number;
}

export function findClip(composition: Composition, clipId: string): FoundClip | null {
    for (const track of composition.tracks || []) {
        const clips = track.clips || [];
        for (let i = 0; i < clips.length; i++) {
            if (clips[i].id === clipId) return { clip: clips[i], track: track.kind, index: i };
        }
    }
    return null;
}

/** Map one track's clips, leaving every other track identical. */
function mapTrack(
    composition: Composition,
    kind: TrackKind,
    fn: (clips: Clip[]) => Clip[]
): Composition {
    return {
        ...composition,
        tracks: (composition.tracks || []).map((t) =>
            t.kind === kind ? { ...t, clips: fn(t.clips || []) } : t
        ),
    };
}

/** Map whichever track holds `clipId`. */
function mapClip(
    composition: Composition,
    clipId: string,
    fn: (clip: Clip) => Clip
): Composition {
    const found = findClip(composition, clipId);
    if (!found) return composition;
    return mapTrack(composition, found.track, (clips) =>
        clips.map((c) => (c.id === clipId ? fn(c) : c))
    );
}

/**
 * Ensure a track of this kind exists, so an overlay can be added to a
 * composition that only ever had a picture track — which is every composition
 * derived from a design.
 */
function withTrack(composition: Composition, kind: TrackKind): Composition {
    if ((composition.tracks || []).some((t) => t.kind === kind)) return composition;
    const track: Track = { kind, clips: [] };
    return { ...composition, tracks: [...(composition.tracks || []), track] };
}

export function appendClip(composition: Composition, clip: Clip): Composition {
    return withDerivedOffsets(
        mapTrack(composition, "video", (clips) => [...clips, clip])
    );
}

export function insertClipAfter(
    composition: Composition,
    afterClipId: string,
    clip: Clip
): Composition {
    const clips = videoTrack(composition)?.clips ?? [];
    const at = clips.findIndex((c) => c.id === afterClipId);
    if (at < 0) return appendClip(composition, clip);
    return withDerivedOffsets(
        mapTrack(composition, "video", (cur) => [
            ...cur.slice(0, at + 1),
            clip,
            ...cur.slice(at + 1),
        ])
    );
}

/**
 * Remove a clip.
 *
 * The LAST picture clip is deliberately not removable: a composition with an
 * empty video track cannot render, and the honest way to end up with no media
 * is to clear the media. The UI hides the affordance; this refuses it too, so a
 * keyboard path or a future caller cannot produce the state.
 */
export function removeClip(composition: Composition, clipId: string): Composition {
    const found = findClip(composition, clipId);
    if (!found) return composition;
    if (found.track === "video" && (videoTrack(composition)?.clips ?? []).length <= 1) {
        return composition;
    }
    return withDerivedOffsets(
        mapTrack(composition, found.track, (clips) => clips.filter((c) => c.id !== clipId))
    );
}

/** Move a picture clip one place earlier or later. Overlays do not reorder. */
export function moveClip(composition: Composition, clipId: string, dir: -1 | 1): Composition {
    const clips = videoTrack(composition)?.clips ?? [];
    const at = clips.findIndex((c) => c.id === clipId);
    const to = at + dir;
    if (at < 0 || to < 0 || to >= clips.length) return composition;
    const next = [...clips];
    [next[at], next[to]] = [next[to], next[at]];
    return withDerivedOffsets(mapTrack(composition, "video", () => next));
}

export function setClipDuration(
    composition: Composition,
    clipId: string,
    ms: number
): Composition {
    const safe = Math.max(MIN_CLIP_MS, Math.round(ms));
    return withDerivedOffsets(mapClip(composition, clipId, (c) => ({ ...c, durationMs: safe })));
}

/**
 * Set how a clip enters.
 *
 * The length is not clamped here — `measureComposition` already clamps an
 * overlap to half the shorter of the two clips it joins, and clamping again in
 * the editor would store a different number than the one the renderer uses. The
 * stored value stays what the user asked for, so lengthening the clips either
 * side restores the fade they wanted rather than leaving it at whatever it was
 * squeezed to.
 */
export function setTransition(
    composition: Composition,
    clipId: string,
    kind: CompositionTransitionKind,
    ms?: number
): Composition {
    return withDerivedOffsets(
        mapClip(composition, clipId, (c) => ({
            ...c,
            transitionIn:
                kind === "cut"
                    ? { kind: "cut", ms: 0 }
                    : { kind: "fade", ms: Math.max(1, Math.round(ms ?? c.transitionIn?.ms ?? DEFAULT_TRANSITION_MS)) },
        }))
    );
}

export function patchClipSource<T extends ClipSource>(
    composition: Composition,
    clipId: string,
    patch: Partial<T>
): Composition {
    return withDerivedOffsets(
        mapClip(composition, clipId, (c) => ({
            ...c,
            source: { ...c.source, ...patch } as ClipSource,
        }))
    );
}

/**
 * How long footage is on screen, given its trim and its speed.
 *
 * At 2× a three-second window of source takes a second and a half. The renderer
 * reads `durationMs` for the frames it emits and the trim window for what it
 * decodes, so the two have to agree: a clip declaring four seconds over a
 * window that only holds two renders two seconds of video and then a freeze.
 */
export function footageOnScreenMs(source: FootageClipSource, assetMs?: number): number {
    const inMs = Math.max(0, Math.round(source.inMs ?? 0));
    const end = source.outMs ?? assetMs ?? 0;
    const span = Math.round(end) - inMs;
    const speed = source.speed && source.speed > 0 ? source.speed : 1;
    if (!(span > 0)) return MIN_CLIP_MS;
    return Math.max(MIN_CLIP_MS, Math.round(span / speed));
}

/**
 * Change a footage clip's trim, speed or volume, and re-length it to match.
 *
 * The re-length is the whole reason this is one function rather than two calls:
 * trimming a take and leaving the clip's on-screen length alone is how a
 * timeline ends up with a freeze-frame at the end of a clip nobody asked for.
 */
export function patchFootage(
    composition: Composition,
    clipId: string,
    patch: Partial<FootageClipSource>,
    assetMs?: number
): Composition {
    const found = findClip(composition, clipId);
    if (!found || found.clip.source.kind !== "footage") return composition;
    const next: FootageClipSource = { ...(found.clip.source as FootageClipSource), ...patch };
    // An out point before the in point is not a trim; it is two fields mid-edit.
    if (next.outMs !== undefined && next.inMs !== undefined && next.outMs <= next.inMs) {
        next.outMs = next.inMs + MIN_CLIP_MS;
    }
    return withDerivedOffsets(
        mapClip(composition, clipId, (c) => ({
            ...c,
            source: next,
            durationMs: footageOnScreenMs(next, assetMs),
        }))
    );
}

/**
 * Cut a range of SOURCE time out of a footage clip.
 *
 * This is what striking a line out of the transcript has to mean. The words
 * carry source timings, so removing them is removing a window of the take —
 * and a window out of the middle leaves two pieces, which is why this returns a
 * composition rather than a patch: the clip becomes two clips, in order, and
 * everything after them shifts up because picture offsets are derived.
 *
 * A range that reaches either edge is a trim rather than a split, and is one
 * clip. A range that covers the whole clip is refused — the result would be a
 * clip of nothing, and "delete the clip" is a different gesture with its own
 * affordance.
 */
export function cutFootageRange(
    composition: Composition,
    clipId: string,
    fromMs: number,
    toMs: number,
    assetMs?: number
): Composition {
    const found = findClip(composition, clipId);
    if (!found || found.track !== "video" || found.clip.source.kind !== "footage") {
        return composition;
    }
    const source = found.clip.source as FootageClipSource;
    const inMs = Math.max(0, Math.round(source.inMs ?? 0));
    const outMs = Math.round(source.outMs ?? assetMs ?? 0);
    if (!(outMs > inMs)) return composition;

    const from = Math.max(inMs, Math.min(Math.round(fromMs), outMs));
    const to = Math.max(inMs, Math.min(Math.round(toMs), outMs));
    if (to - from < 1) return composition;

    const head = from - inMs;
    const tail = outMs - to;
    // Nothing would be left. Refused rather than silently deleting the clip.
    if (head <= 0 && tail <= 0) return composition;

    const pieces: Clip[] = [];
    if (head > 0) {
        const s: FootageClipSource = { ...source, inMs, outMs: from };
        pieces.push({
            ...found.clip,
            source: s,
            durationMs: footageOnScreenMs(s, assetMs),
        });
    }
    if (tail > 0) {
        const s: FootageClipSource = { ...source, inMs: to, outMs };
        pieces.push({
            // A new id: this is a new clip, and reusing the old one would make
            // two clips in the same composition share an id.
            ...found.clip,
            id: head > 0 ? newClipId() : found.clip.id,
            source: s,
            durationMs: footageOnScreenMs(s, assetMs),
            // The second piece follows the first with a cut. Carrying the
            // original clip's fade here would fade from the take into itself.
            transitionIn: head > 0 ? { kind: "cut", ms: 0 } : found.clip.transitionIn,
        });
    }

    return withDerivedOffsets(
        mapTrack(composition, "video", (clips) =>
            clips.flatMap((c) => (c.id === clipId ? pieces : [c]))
        )
    );
}

/**
 * Move or resize an overlay.
 *
 * `startMs` is AUTHORED for an overlay and absolute, unlike a picture clip's
 * derived offset — a gap between captions is ordinary, while a gap in the
 * picture can only render as black. So this is the one edit that writes
 * `startMs` and means it.
 */
export function setOverlayWindow(
    composition: Composition,
    clipId: string,
    startMs: number,
    durationMs?: number
): Composition {
    const found = findClip(composition, clipId);
    if (!found || found.track !== "overlay") return composition;
    return withDerivedOffsets(
        mapClip(composition, clipId, (c) => ({
            ...c,
            startMs: Math.max(0, Math.round(startMs)),
            durationMs: Math.max(MIN_CLIP_MS, Math.round(durationMs ?? c.durationMs)),
        }))
    );
}

export function addOverlay(composition: Composition, clip: Clip): Composition {
    return withDerivedOffsets(
        mapTrack(withTrack(composition, "overlay"), "overlay", (clips) => [...clips, clip])
    );
}

/** Overlays in the order they appear, for a UI that lays them out by time. */
export function overlaysOf(composition: Composition) {
    return measureOverlays(composition);
}

/**
 * Build a clip from a library asset.
 *
 * A video keeps the asset's OWN in and out points when it has them — that is
 * what `trimInMs`/`trimOutMs` are for: the usable part of the take, recorded
 * once so every placement of it starts where the take does rather than on the
 * two seconds of someone walking up to the camera.
 *
 * `assetId` travels with the clip alongside the url. The url is what renders;
 * the id is what lets the inspector find the transcript and the shot list
 * again, and what a later re-host could repoint.
 */
export function clipFromAsset(asset: IAsset, fallbackMs = DEFAULT_IMAGE_CLIP_MS): Clip {
    if (asset.kind === "video") {
        const outMs = asset.trimOutMs ?? asset.durationMs ?? asset.ingest?.durationMs;
        const source: FootageClipSource = {
            kind: "footage",
            url: asset.url,
            assetId: asset.id,
            inMs: asset.trimInMs ?? 0,
            // Spread, so an unknown out point leaves the KEY out. Firestore
            // refuses a write containing `undefined`, and "we do not know where
            // this take ends" is absence, not a value.
            ...(outMs !== undefined ? { outMs } : {}),
            // Audio OFF by default. A clip dropped onto a timeline that already
            // has a music bed and a voiceover should not start talking over
            // them; turning it up is one control in the inspector, and noticing
            // that it is already up is a render away.
            volume: 0,
        };
        const assetMs = asset.durationMs ?? asset.ingest?.durationMs;
        return {
            id: newClipId(),
            durationMs: footageOnScreenMs(source, assetMs),
            source,
        };
    }
    return {
        id: newClipId(),
        durationMs: Math.max(MIN_CLIP_MS, Math.round(fallbackMs)),
        source: {
            kind: "image",
            url: asset.url,
            assetId: asset.id,
            // A still that sits perfectly motionless in a video reads as a
            // loading state. A slow push is the convention for exactly this,
            // and it is one control away from off.
            kenBurns: "in",
        },
    };
}

/** A one-line description of what a clip is, for a tile and for the inspector. */
export function clipLabel(clip: Clip): string {
    const s = clip.source;
    switch (s?.kind) {
        case "design":
            return s.sceneIndex !== undefined && s.sceneIndex !== null
                ? `Scene ${s.sceneIndex + 1}`
                : "Your design";
        case "footage":
            return "Your footage";
        case "image":
            return "Still";
        case "genvideo":
            return s.url ? "AI clip" : "AI clip — generating";
        default:
            return "Clip";
    }
}
