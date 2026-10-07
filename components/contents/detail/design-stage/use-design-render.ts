/**
 * use-design-render — capture a design canvas to publishable media.
 *
 * A design is HTML until someone renders it. This owns that one job: drive the
 * frame's capture, upload the result, and write it onto the content as
 * attachments (plus `renderUrl` on the revision, which is what marks that
 * revision as rendered).
 *
 * Extracted from DesignStage so the Media Stage can offer the same action.
 * Rendering was previously reachable only from the Studio header — two screens
 * away from where the user judges whether the post is ready — so a design could
 * sit looking finished and unpublishable indefinitely.
 *
 * The caller owns the frame: pass `onFrameMessage` into <DesignFrame onMessage>
 * and give `startRender` the same ref. Whichever surface mounts the frame can
 * render; nothing here assumes the Studio.
 */
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { IContentAudio } from "@/shared-libs/firestore/trendly-pro/models/design";
import { DesignFrameHandle, FrameOutMsg } from "./bridge";

/** 15fps, not 24: html2canvas rasterizes ~1s/frame regardless of resolution, so
 *  frame count is the only real lever on render time. Smooth enough for these
 *  motion-graphic reels. (The real fix for long videos is a server-side render.) */
const VIDEO_FPS = 15;

export interface RenderError {
    message: string;
    retry: boolean;
}

export interface UseDesignRenderOptions {
    isVideoDesign: boolean;
    slideCount: number;
    /** Current revision id — the render is recorded against it. */
    revisionId?: string;
    audio?: IContentAudio;
    setRenders: (revisionId: string, renderUrls: string[]) => Promise<void>;
    setVideoRender: (revisionId: string, videoUrl: string) => Promise<void>;
    /** Called before a video capture so the caller can stop playback. */
    onBeforeVideoCapture?: () => void;
}

export interface UseDesignRenderReturn {
    capturing: boolean;
    /** 0..1 while frames are being captured; null when indeterminate/idle. */
    progress: number | null;
    error: RenderError | null;
    clearError: () => void;
    /** "Render video" / "Render 6 slides" / "Render image". */
    label: string;
    startRender: (frame: DesignFrameHandle | null) => void;
    /** Feed every FrameOutMsg here; returns true when it handled the message. */
    onFrameMessage: (msg: FrameOutMsg) => boolean;
}

const uploadTo = async (filename: string, contentType: string, body: Blob): Promise<string> => {
    const res = await HttpWrapper.fetch(`/s3/v1/attachments?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
    });
    const { uploadUrl, attachmentUrl } = await res.json();
    await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body });
    return attachmentUrl as string;
};

const stamp = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function useDesignRender({
    isVideoDesign,
    slideCount,
    revisionId,
    audio,
    setRenders,
    setVideoRender,
    onBeforeVideoCapture,
}: UseDesignRenderOptions): UseDesignRenderReturn {
    const [capturing, setCapturing] = useState(false);
    const [prog, setProg] = useState<{ done: number; total: number } | null>(null);
    const [error, setError] = useState<RenderError | null>(null);

    const progress = prog && prog.total > 0 ? prog.done / prog.total : null;

    const label = isVideoDesign
        ? "Render video"
        : slideCount > 1
            ? `Render ${slideCount} slides`
            : "Render image";

    const finish = useCallback(() => {
        setCapturing(false);
        setProg(null);
    }, []);

    const startRender = useCallback(
        (frame: DesignFrameHandle | null) => {
            if (!frame) return;
            setError(null);
            if (isVideoDesign) {
                if (Platform.OS !== "web") {
                    setError({ message: "Video export is available in the web app for now.", retry: false });
                    return;
                }
                onBeforeVideoCapture?.();
                setCapturing(true);
                setProg({ done: 0, total: 0 });
                frame.captureVideo(
                    VIDEO_FPS,
                    audio
                        ? {
                            musicUrl: audio.musicUrl,
                            voiceoverUrl: audio.voiceoverUrl,
                            musicVolume: audio.musicVolume,
                            voiceoverVolume: audio.voiceoverVolume,
                            duckMusic: audio.duckMusic,
                        }
                        : undefined
                );
                return;
            }
            setCapturing(true);
            setProg({ done: 0, total: slideCount });
            frame.captureAll(slideCount);
        },
        [isVideoDesign, slideCount, audio, onBeforeVideoCapture]
    );

    const onFrameMessage = useCallback(
        (msg: FrameOutMsg): boolean => {
            if (msg.type === "renderProgress") {
                setProg({ done: msg.frame, total: msg.total });
                return true;
            }

            if (msg.type === "renderVideo") {
                // Encoding is done; the upload is indeterminate.
                setProg({ done: 0, total: 0 });
                uploadTo(`design_${stamp()}.mp4`, "video/mp4", msg.blob)
                    .then((url) => (revisionId ? setVideoRender(revisionId, url) : undefined))
                    .then(() => Toaster.success("Video rendered", "Saved to your content."))
                    .catch(() =>
                        setError({
                            message:
                                "Your video rendered, but we couldn't save it. Check your connection and try again.",
                            retry: true,
                        })
                    )
                    .finally(finish);
                return true;
            }

            if (msg.type === "renderSlides" || msg.type === "render") {
                const dataUrls = msg.type === "renderSlides" ? msg.dataUrls : [msg.dataUrl];
                setProg({ done: 0, total: 0 });
                Promise.all(
                    dataUrls.map(async (d, i) =>
                        uploadTo(`design_${stamp()}_s${i}.png`, "image/png", await (await fetch(d)).blob())
                    )
                )
                    .then((urls) => (revisionId ? setRenders(revisionId, urls) : undefined))
                    .then(() =>
                        Toaster.success(
                            dataUrls.length > 1 ? "Slides rendered" : "Image rendered",
                            "Saved to your content."
                        )
                    )
                    .catch(() =>
                        setError({
                            message: "Couldn't save the render. Check your connection and try again.",
                            retry: true,
                        })
                    )
                    .finally(finish);
                return true;
            }

            if (msg.type === "error") {
                finish();
                // Surface the frame's actual reason — hard-coding "your browser may
                // not support…" for every video failure once masked a real encoder bug.
                if (msg.message) console.warn("[design render] error:", msg.message);
                const detail = msg.message ? ` (${msg.message})` : "";
                setError(
                    isVideoDesign
                        ? {
                            message: `Couldn't render the video.${detail} If this keeps happening, try Chrome on desktop.`,
                            retry: true,
                        }
                        : {
                            message: `Something went wrong while rendering.${detail} Please try again.`,
                            retry: true,
                        }
                );
                return true;
            }

            return false;
        },
        [isVideoDesign, revisionId, setRenders, setVideoRender, finish]
    );

    return {
        capturing,
        progress,
        error,
        clearError: useCallback(() => setError(null), []),
        label,
        startRender,
        onFrameMessage,
    };
}
