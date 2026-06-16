import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { aiWS } from "@/utils/ai-ws";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

// Shared upgrade prompt for premium-gated AI actions (script/image on free plans,
// or any task whose plan unlocks no allowed model). When the reason is
// token exhaustion we DON'T redirect — the surface shows an in-context upgrade/
// top-up affordance — we only confirm why the action stopped.
function promptUpgrade(reason?: string) {
    if (reason === "tokens_exhausted") {
        Toaster.error("You're out of AI tokens this month. Upgrade or add a top-up to continue.");
        return;
    }
    Toaster.error("This needs a higher plan. Please upgrade to continue.");
    router.push("/billing");
}

export interface CaptionVariant {
    length: "short" | "medium" | "long";
    text: string;
}

export interface HashtagGroup {
    tier: "broad" | "niche" | "brand";
    tags: string[];
}

export interface ImageResult {
    index: number;
    s3Url: string;
}

export function useAIGenerate() {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    // ── Caption ──────────────────────────────
    const [captions, setCaptions] = useState<CaptionVariant[]>([]);
    const [captionLoading, setCaptionLoading] = useState(false);

    const generateCaption = useCallback(async (args: {
        topic: string;
        platform?: string;
        format?: string;
        tone?: string;
        contextId?: string;
        model?: string;
        /** Live editor content so the AI has the current (unsaved) context. */
        title?: string;
        description?: string;
        caption?: string;
        hashtags?: string;
        script?: string;
    }) => {
        if (!brandId) return;
        setCaptionLoading(true);
        try {
            const res = await HttpWrapper.fetch(`/api/ai/content/caption`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brandId, ...args }),
            });
            const data = await res.json();
            setCaptions((data.variants ?? []) as CaptionVariant[]);
        } catch (e: any) {
            if (e?.status === 402) promptUpgrade();
        } finally {
            setCaptionLoading(false);
        }
    }, [brandId]);

    // ── Hashtags ─────────────────────────────
    const [hashtags, setHashtags] = useState<HashtagGroup[]>([]);
    const [hashtagLoading, setHashtagLoading] = useState(false);

    const generateHashtags = useCallback(async (args: {
        topic: string;
        platform?: string;
        contextId?: string;
        model?: string;
        /** Live editor content so the AI has the current (unsaved) context. */
        title?: string;
        format?: string;
        description?: string;
        caption?: string;
        hashtags?: string;
        script?: string;
    }) => {
        if (!brandId) return;
        setHashtagLoading(true);
        try {
            const res = await HttpWrapper.fetch(`/api/ai/content/hashtags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brandId, ...args }),
            });
            const data = await res.json();
            setHashtags((data.groups ?? []) as HashtagGroup[]);
        } catch (e: any) {
            if (e?.status === 402) promptUpgrade();
        } finally {
            setHashtagLoading(false);
        }
    }, [brandId]);

    // ── Script (streamed via WS) ─────────────
    const [script, setScript] = useState("");
    const [scriptStreaming, setScriptStreaming] = useState(false);
    const scriptActiveRef = useRef(false);
    const scriptAccumRef = useRef("");

    // ── Images (streamed via WS) ─────────────
    const [images, setImages] = useState<ImageResult[]>([]);
    const [imagesStreaming, setImagesStreaming] = useState(false);
    const imagesActiveRef = useRef(false);

    useEffect(() => {
        const remove = aiWS.addListener((msg: any) => {
            if (scriptActiveRef.current && msg.type === "token" && typeof msg.delta === "string") {
                scriptAccumRef.current += msg.delta;
                setScript(scriptAccumRef.current);
                return;
            }
            if (scriptActiveRef.current && msg.type === "done") {
                scriptActiveRef.current = false;
                setScriptStreaming(false);
                return;
            }
            if (imagesActiveRef.current && msg.type === "image") {
                setImages((prev) => [...prev, { index: msg.index ?? prev.length, s3Url: msg.s3Url }]);
                return;
            }
            if (imagesActiveRef.current && msg.type === "done") {
                imagesActiveRef.current = false;
                setImagesStreaming(false);
                return;
            }
            if (msg.type === "upgrade_required") {
                scriptActiveRef.current = false;
                imagesActiveRef.current = false;
                setScriptStreaming(false);
                setImagesStreaming(false);
                promptUpgrade(msg.reason);
                return;
            }
            if (msg.type === "error") {
                scriptActiveRef.current = false;
                imagesActiveRef.current = false;
                setScriptStreaming(false);
                setImagesStreaming(false);
            }
        });
        return remove;
    }, []);

    const generateScript = useCallback(async (args: {
        videoType: string;
        topic: string;
        keyMessage: string;
        tone?: string;
        contextId?: string;
        model?: string;
        /** Live editor content so the AI has the current (unsaved) context. */
        title?: string;
        platform?: string;
        format?: string;
        description?: string;
        caption?: string;
        hashtags?: string;
        script?: string;
    }) => {
        if (!brandId) return;
        scriptAccumRef.current = "";
        setScript("");
        setScriptStreaming(true);
        scriptActiveRef.current = true;
        await aiWS.send({
            type: "content_gen",
            task: "script",
            brandId,
            model: args.model,
            payload: {
                brandId,
                contextId: args.contextId,
                videoType: args.videoType,
                topic: args.topic,
                keyMessage: args.keyMessage,
                tone: args.tone,
                title: args.title,
                platform: args.platform,
                format: args.format,
                description: args.description,
                caption: args.caption,
                hashtags: args.hashtags,
                script: args.script,
            },
        });
    }, [brandId]);

    const generateImage = useCallback(async (args: {
        description: string;
        style?: string;
        aspectRatio?: string;
        count?: number;
        /** Content doc id — the backend persists results + status here. */
        contextId?: string;
        /** Carousel (append) vs single-image (replace) content type. */
        multi?: boolean;
        model?: string;
    }) => {
        if (!brandId) return;
        setImages([]);
        setImagesStreaming(true);
        imagesActiveRef.current = true;
        await aiWS.send({
            type: "content_gen",
            task: "image",
            brandId,
            model: args.model,
            payload: {
                brandId,
                contextId: args.contextId,
                description: args.description,
                style: args.style,
                aspectRatio: args.aspectRatio ?? "1:1",
                count: args.count ?? 1,
                multi: args.multi ?? false,
            },
        });
    }, [brandId]);

    return {
        // captions
        captions, captionLoading, generateCaption,
        // hashtags
        hashtags, hashtagLoading, generateHashtags,
        // script
        script, scriptStreaming, generateScript,
        // images
        images, imagesStreaming, generateImage,
    };
}
