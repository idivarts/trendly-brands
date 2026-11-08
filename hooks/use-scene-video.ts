/**
 * AI video for one scene: what it will cost, and starting it.
 *
 * ── Why the quote comes first ───────────────────────────────────────────────
 * Generated video is an order of magnitude dearer than anything else in the
 * product, and the price depends on a number the user picks (the length). So
 * the quote is fetched as soon as a model and a duration are chosen, and shown
 * next to the button rather than after it. A cost gate that only refuses is
 * half a gate; the other half is telling people the price while they can still
 * change their mind.
 *
 * ── The refusals this has to understand ────────────────────────────────────
 * The backend answers with a `reason`, and each one wants a different thing
 * from the user:
 *
 *   tokens_exhausted          a top-up
 *   plan_locked               a tier
 *   anchor_required           pick an approved still for that cast member
 *   incompatible_capabilities drop the chain or drop the face
 *   unsupported_capability    a different model or a different length
 *
 * Collapsing them into "something went wrong" would send people to the wrong
 * screen, or to no screen at all for the two that are fixable in place.
 */
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { StudioState } from "@/utils/studio-api";
import { IMediaModel } from "@/shared-libs/firestore/trendly-pro/models/media-model";
import { useCallback, useEffect, useState } from "react";

export interface VideoQuote {
    tokens: number;
    durationSecs: number;
    model: {
        id: string;
        displayName: string;
        durationsS?: number[];
        minS?: number;
        maxS?: number;
        startFrame?: boolean;
        endFrame?: boolean;
        imageRefs?: boolean;
        nativeAudio?: boolean;
        resolutions?: string[];
    };
    /** Per-model rates are not published by providers. Always say so. */
    provisional: boolean;
}

/** A refusal the UI can act on in place. */
export interface VideoRefusal {
    reason:
        | "tokens_exhausted"
        | "plan_locked"
        | "anchor_required"
        | "incompatible_capabilities"
        | "unsupported_capability"
        | "unknown";
    message: string;
    /** For anchor_required: who needs one, and in how many clips they appear. */
    castId?: string;
    appearances?: number;
}

export interface UseSceneVideoResult {
    quote: VideoQuote | null;
    quoting: boolean;
    generating: boolean;
    refusal: VideoRefusal | null;
    chaining: boolean;

    getQuote: (modelId: string, durationSecs: number) => Promise<void>;
    generate: (input: {
        sceneId: string;
        modelId: string;
        prompt: string;
        durationSecs: number;
        resolution?: string;
        generateAudio?: boolean;
        castIds?: string[];
        locationId?: string;
        startFrameMediaId?: string;
        chainedFromSceneId?: string;
    }) => Promise<boolean>;
    /** Extract the previous beat's last frame, so the next one can chain. */
    prepareChain: (sceneId: string, fromSceneId: string) => Promise<boolean>;
    clearRefusal: () => void;
}

export function useSceneVideo(
    brandId: string | undefined,
    contentId: string | undefined,
    studioId: string | undefined,
    onState: (state: StudioState) => void
): UseSceneVideoResult {
    const [quote, setQuote] = useState<VideoQuote | null>(null);
    const [quoting, setQuoting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [chaining, setChaining] = useState(false);
    const [refusal, setRefusal] = useState<VideoRefusal | null>(null);

    const base = useCallback(
        () => `/api/studio/brands/${brandId}/contents/${contentId}/studios/${studioId}`,
        [brandId, contentId, studioId]
    );

    const readRefusal = (e: unknown): VideoRefusal => {
        const err = e as { data?: Record<string, unknown>; status?: number };
        const data = err?.data ?? {};
        const code = (data.reason as string) || (data.error as string) || "unknown";
        const known: VideoRefusal["reason"][] = [
            "tokens_exhausted",
            "plan_locked",
            "anchor_required",
            "incompatible_capabilities",
            "unsupported_capability",
        ];
        return {
            reason: (known.includes(code as VideoRefusal["reason"])
                ? code
                : "unknown") as VideoRefusal["reason"],
            message:
                (data.message as string) ||
                "We couldn't start that clip. Please try again.",
            castId: data.castId as string | undefined,
            appearances: data.appearances as number | undefined,
        };
    };

    const getQuote = useCallback(
        async (modelId: string, durationSecs: number) => {
            if (!brandId || !studioId || !modelId) return;
            setQuoting(true);
            try {
                const res = await HttpWrapper.fetch(
                    `${base()}/video-quote?modelId=${encodeURIComponent(modelId)}&durationSecs=${durationSecs}`
                );
                setQuote((await res.json()) as VideoQuote);
            } catch {
                // No quote is better than a wrong one: the panel hides the
                // price rather than showing a stale number next to a button
                // that will charge a different amount.
                setQuote(null);
            } finally {
                setQuoting(false);
            }
        },
        [base, brandId, studioId]
    );

    const generate = useCallback(
        async (input: Parameters<UseSceneVideoResult["generate"]>[0]): Promise<boolean> => {
            if (!brandId || !contentId || !studioId) return false;
            setGenerating(true);
            setRefusal(null);
            try {
                const res = await HttpWrapper.fetch(
                    `${base()}/scenes/${input.sceneId}/generate-video`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            modelId: input.modelId,
                            prompt: input.prompt,
                            durationSecs: input.durationSecs,
                            resolution: input.resolution,
                            generateAudio: input.generateAudio ?? false,
                            castIds: input.castIds ?? [],
                            locationId: input.locationId,
                            startFrameMediaId: input.startFrameMediaId,
                            chainedFromSceneId: input.chainedFromSceneId,
                        }),
                    }
                );
                // 202 with a job id. The scene is marked pending on the
                // document, and the rail follows that through its own
                // subscription — there is nothing to wait for here.
                await res.json();
                return true;
            } catch (e) {
                setRefusal(readRefusal(e));
                return false;
            } finally {
                setGenerating(false);
            }
        },
        [base, brandId, contentId, studioId]
    );

    const prepareChain = useCallback(
        async (sceneId: string, fromSceneId: string): Promise<boolean> => {
            if (!brandId || !contentId || !studioId) return false;
            setChaining(true);
            setRefusal(null);
            try {
                await HttpWrapper.fetch(`${base()}/scenes/${sceneId}/prepare-chain`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fromSceneId }),
                });
                return true;
            } catch (e) {
                setRefusal(readRefusal(e));
                return false;
            } finally {
                setChaining(false);
            }
        },
        [base, brandId, contentId, studioId]
    );

    // Drop a stale quote when the studio changes under us.
    useEffect(() => {
        setQuote(null);
    }, [studioId]);

    return {
        quote,
        quoting,
        generating,
        chaining,
        refusal,
        getQuote,
        generate,
        prepareChain,
        clearRefusal: () => setRefusal(null),
    };
}

/** The lengths a model actually accepts, as numbers. */
export function acceptedDurations(model: IMediaModel | undefined): number[] {
    if (!model) return [4];
    if (model.durationsS?.length) return model.durationsS;
    const min = model.minDurationS ?? 4;
    const max = model.maxDurationS ?? 8;
    const out: number[] = [];
    for (let s = min; s <= max && out.length < 8; s += 2) out.push(s);
    return out.length ? out : [min];
}
