/**
 * The Design Studio's backend calls.
 *
 * ⚠️ Every scene edit goes through here rather than straight to Firestore, which
 * is the opposite of how designs and compositions work. The reason is media
 * REFERENCE COUNTS: placing media in a scene increments it, clearing decrements,
 * swapping moves only the difference, and those counts are what make "archive,
 * never hard-delete" enforceable. Maintaining them in the client would mean
 * getting it right on every one of a dozen edit paths, and the first one that
 * forgot would either strand media as un-archivable or let a sweep delete
 * something still on screen.
 *
 * The UI does not feel the round trip: `use-studio` applies each edit
 * optimistically and the Firestore subscription confirms it. So a drag lands
 * instantly, and the counts are still true.
 *
 * Every mutation returns THE WHOLE STUDIO plus its measured timeline. That is
 * deliberate: the client then has no reason to keep its own idea of the order or
 * the duration, which is precisely the habit that left the old studio with two
 * timelines that disagreed about what scene 3 was.
 */
import {
    IAudioLane,
    ICastMember,
    IStudio,
    IStudioLayer,
    IStudioLocation,
    IStudioScene,
    ISceneNarration,
    ITransition,
    StudioFormat,
    TransitionPreset,
} from "@/shared-libs/firestore/trendly-pro/models/studio";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";

/** What every studio mutation answers with. */
export interface StudioState {
    studio: IStudio;
    scenes: IStudioScene[];
    timeline: {
        totalMs: number;
        /** Each scene's start on the timeline, AFTER transition overlaps. */
        starts: Record<string, number>;
    };
}

const base = (brandId: string, contentId: string) =>
    `/api/studio/brands/${brandId}/contents/${contentId}`;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await HttpWrapper.fetch(path, init);
    return (await res.json()) as T;
}

function body(payload: unknown): RequestInit {
    return {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    };
}

/**
 * Open the studio for a content, creating an empty one if it has none.
 *
 * Idempotent — the app calls it on every navigation to the route, so it has to
 * be. It never creates a second studio for a content that already has one,
 * because that would orphan the scenes the user has already made.
 */
export function openStudio(
    brandId: string,
    contentId: string,
    format?: StudioFormat
): Promise<StudioState> {
    return call<StudioState>(`${base(brandId, contentId)}/open`, body({ format }));
}

export function getStudio(
    brandId: string,
    contentId: string,
    studioId: string
): Promise<StudioState> {
    return call<StudioState>(`${base(brandId, contentId)}/studios/${studioId}`);
}

export interface PatchStudioInput {
    format?: StudioFormat;
    fps?: number;
    transitionPreset?: TransitionPreset;
    audio?: { lanes: IAudioLane[]; voiceId?: string };
    cast?: ICastMember[];
    locations?: IStudioLocation[];
}

export function patchStudio(
    brandId: string,
    contentId: string,
    studioId: string,
    input: PatchStudioInput
): Promise<StudioState> {
    return call<StudioState>(`${base(brandId, contentId)}/studios/${studioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
}

export interface AddSceneInput {
    /**
     * Where to insert. Omitted appends.
     *
     * "Add an empty scene in the middle" is a real requirement, and
     * append-then-reorder would briefly show the scene at the end — which on a
     * rail the user is watching reads as the wrong thing happening and then
     * correcting itself.
     */
    at?: number;
    durationMs?: number;
    title?: string;
    /**
     * Layers may be supplied so "add a scene from this media" is ONE call.
     * Two calls would flash an empty scene on the rail first.
     */
    layers?: IStudioLayer[];
}

export function addScene(
    brandId: string,
    contentId: string,
    studioId: string,
    input: AddSceneInput = {}
): Promise<StudioState> {
    return call<StudioState>(
        `${base(brandId, contentId)}/studios/${studioId}/scenes`,
        body(input)
    );
}

/**
 * Replace the order.
 *
 * The WHOLE array, never a move instruction: order is one fact, and a partial
 * update to it is how two clients end up believing different sequences. The
 * backend refuses an order that is not exactly the scenes that exist, so a
 * dropped id cannot delete a scene by omission.
 */
export function reorderScenes(
    brandId: string,
    contentId: string,
    studioId: string,
    order: string[]
): Promise<StudioState> {
    return call<StudioState>(
        `${base(brandId, contentId)}/studios/${studioId}/scenes/order`,
        body({ order })
    );
}

export interface PatchSceneInput {
    durationMs?: number;
    title?: string;
    transitionIn?: ITransition;
    narration?: ISceneNarration;
}

export function patchScene(
    brandId: string,
    contentId: string,
    studioId: string,
    sceneId: string,
    input: PatchSceneInput
): Promise<StudioState> {
    return call<StudioState>(
        `${base(brandId, contentId)}/studios/${studioId}/scenes/${sceneId}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        }
    );
}

/**
 * Replace a scene's whole stack.
 *
 * The whole stack, because the backend moves reference counts by the DIFFERENCE
 * and needs both sides to compute it. A per-layer endpoint would make that
 * difference the client's job to describe, which is how a count goes wrong.
 */
export function setSceneLayers(
    brandId: string,
    contentId: string,
    studioId: string,
    sceneId: string,
    layers: IStudioLayer[]
): Promise<StudioState> {
    return call<StudioState>(
        `${base(brandId, contentId)}/studios/${studioId}/scenes/${sceneId}/layers`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layers }),
        }
    );
}

export function deleteScene(
    brandId: string,
    contentId: string,
    studioId: string,
    sceneId: string
): Promise<StudioState> {
    return call<StudioState>(
        `${base(brandId, contentId)}/studios/${studioId}/scenes/${sceneId}`,
        { method: "DELETE" }
    );
}

export function duplicateScene(
    brandId: string,
    contentId: string,
    studioId: string,
    sceneId: string
): Promise<StudioState> {
    return call<StudioState>(
        `${base(brandId, contentId)}/studios/${studioId}/scenes/${sceneId}/duplicate`,
        body({})
    );
}

/**
 * Replace the studio's cast.
 *
 * The whole list, because the cast is one fact about the document and a
 * per-member call invites two clients to disagree about who is in it. The
 * backend refuses a member with no `look` — that string is what travels into
 * every prompt, so an empty one means nothing is holding the clips together.
 */
export function setCast(
    brandId: string,
    contentId: string,
    studioId: string,
    cast: ICastMember[]
): Promise<StudioState> {
    return call<StudioState>(`${base(brandId, contentId)}/studios/${studioId}/cast`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cast }),
    });
}

export function setLocations(
    brandId: string,
    contentId: string,
    studioId: string,
    locations: IStudioLocation[]
): Promise<StudioState> {
    return call<StudioState>(`${base(brandId, contentId)}/studios/${studioId}/locations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations }),
    });
}

/**
 * Cut a scene in two at a point inside it.
 *
 * ⚠️ Refused for motion and composite scenes, and the refusal carries the
 * reason: both are HTML documents with their own animation, so the second half
 * would start mid-movement. The UI offers duplicate-and-shorten instead, which
 * reaches the same outcome with nothing broken.
 */
export function splitScene(
    brandId: string,
    contentId: string,
    studioId: string,
    sceneId: string,
    atMs: number
): Promise<StudioState> {
    return call<StudioState>(
        `${base(brandId, contentId)}/studios/${studioId}/scenes/${sceneId}/split`,
        body({ atMs })
    );
}
