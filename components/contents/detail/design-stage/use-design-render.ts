/**
 * use-design-render — ask the server to turn a design into publishable media,
 * and report what it is doing.
 *
 * This hook used to BE the renderer: it drove html2canvas in the frame, encoded
 * video with WebCodecs, uploaded the result and wrote it to Firestore. All of
 * that now happens in the render worker, so what is left is a POST and a
 * reading of state the app is already subscribed to.
 *
 * The public shape is deliberately unchanged, because the two surfaces that use
 * it (the Design Studio header and the Media Stage bar) were already written
 * against it — the only difference is that `startRender` no longer needs a
 * frame handle, since the frame is not what renders.
 *
 * Progress and failure come from the REVISION DOCUMENT rather than from local
 * state, which is what makes the render survive a page reload, a phone lock, or
 * the user walking away: the worker keeps going either way.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HttpError, HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { DesignRenderStatus } from "@/shared-libs/firestore/trendly-pro/models/design";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { track } from "@/shared-libs/utils/analytics";

export interface RenderError {
    message: string;
    retry: boolean;
}

export interface UseDesignRenderOptions {
    contentId: string | null;
    /** Current revision id — the render is recorded against it. */
    revisionId?: string;
    /**
     * Which of the content's two kinds of media is being rendered.
     *
     * This exists because of one rule in the backend: an explicit `revisionId`
     * in the request names a DESIGN revision and deliberately bypasses the
     * composition precedence — that is how an older design revision gets
     * re-rendered. So a content with an authored timeline must send NO revision
     * id, or pressing Render would quietly render the design on its own and
     * publish media the user did not arrange.
     *
     * "composition" therefore means "let the server resolve the target", and
     * the caller passes that revision's own render fields below.
     */
    targetKind?: "design" | "composition";
    isVideoDesign: boolean;
    slideCount: number;
    /** Live render state, read off the revision document. */
    renderStatus?: DesignRenderStatus;
    renderProgress?: number;
    renderError?: string;
}

export interface UseDesignRenderReturn {
    /** True from the moment Render is pressed until the worker finishes. */
    capturing: boolean;
    /** 0..1 while frames are rendered; null when indeterminate/idle. */
    progress: number | null;
    error: RenderError | null;
    clearError: () => void;
    /** "Render video" / "Render 6 slides" / "Render image". */
    label: string;
    startRender: () => void;
}

export function useDesignRender({
    contentId,
    revisionId,
    targetKind = "design",
    isVideoDesign,
    slideCount,
    renderStatus,
    renderProgress,
    renderError,
}: UseDesignRenderOptions): UseDesignRenderReturn {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    // In flight between pressing Render and the server acknowledging it. Without
    // this the button would look idle for the half-second before `renderStatus`
    // flips to "queued", and the natural reaction to that is to press again.
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState<RenderError | null>(null);
    // A server-side failure lives on the revision until the next render, so
    // dismissing it has to be local.
    const [dismissedError, setDismissedError] = useState<string | null>(null);

    // When this render was asked for. Rendering is the slowest thing in the
    // product, and it finishes server-side — so without timing it from the
    // press, someone abandoning a long render is indistinguishable from
    // someone who never started one.
    const startedAtRef = useRef<number | null>(null);
    // Guards the terminal report: renderStatus is a prop and re-renders freely,
    // so the effect below would otherwise fire on every parent update.
    const reportedRef = useRef<string | null>(null);

    const label = isVideoDesign
        ? "Render video"
        : slideCount > 1
            ? `Render ${slideCount} slides`
            : "Render image";

    const capturing =
        submitting || renderStatus === "queued" || renderStatus === "rendering";

    const error = useMemo<RenderError | null>(() => {
        if (localError) return localError;
        if (renderStatus === "failed" && renderError && renderError !== dismissedError) {
            return { message: renderError, retry: true };
        }
        return null;
    }, [localError, renderStatus, renderError, dismissedError]);

    const clearError = useCallback(() => {
        setLocalError(null);
        if (renderError) setDismissedError(renderError);
    }, [renderError]);

    const startRender = useCallback(() => {
        if (!brandId || !contentId || !revisionId) return;
        setLocalError(null);
        setDismissedError(null);
        setSubmitting(true);
        startedAtRef.current = Date.now();
        reportedRef.current = null;

        HttpWrapper.fetch(`/api/v2/brands/${brandId}/contents/${contentId}/render`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            // Empty for a composition: naming a revision would be read as
            // naming a DESIGN revision and would skip the timeline entirely.
            body: targetKind === "composition" ? "{}" : JSON.stringify({ revisionId }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({} as Record<string, unknown>));
                // Already rendered and unchanged — the server says so rather
                // than doing the work (and charging for it) twice.
                if (data?.status === "done") {
                    Toaster.success("Already rendered", "This design is up to date.");
                    return;
                }
                Toaster.success(
                    isVideoDesign ? "Rendering your video" : "Rendering your design",
                    "You can leave this page — we'll finish it."
                );
            })
            // HttpWrapper THROWS an HttpError for any status >= 300, so every
            // non-2xx lands here rather than in the success branch.
            .catch(async (err: unknown) => {
                if (err instanceof HttpError && err.status === 402) {
                    // A wall, reported with the same event as every other
                    // gate so "hit a limit" stays one number across the app.
                    track("entitlement_blocked", {
                        reason: "tokens_exhausted",
                        feature: "design_render",
                    });
                    track("design_rendered", {
                        success: false,
                        reason: "tokens_exhausted",
                        duration_ms: startedAtRef.current
                            ? Date.now() - startedAtRef.current
                            : undefined,
                        frames: slideCount,
                    });
                    startedAtRef.current = null;
                    // Out of tokens. Phrased as a limit, not a failure — the
                    // design is fine, the wallet is empty, and retrying it
                    // unchanged would only fail again.
                    setLocalError({
                        message:
                            "You're out of AI tokens, so this render can't run. Top up or upgrade to keep rendering.",
                        retry: false,
                    });
                    return;
                }
                const detail = await HttpWrapper.extractErrorMessage(err).catch(() => null);
                setLocalError({
                    message:
                        detail ||
                        "We couldn't start the render. Check your connection and try again.",
                    retry: true,
                });
            })
            .finally(() => setSubmitting(false));
    }, [brandId, contentId, revisionId, targetKind, isVideoDesign]);

    // The render completes on the server, so the outcome arrives as a
    // renderStatus change rather than as a response to the POST above.
    useEffect(() => {
        if (renderStatus !== "done" && renderStatus !== "failed") return;
        if (!startedAtRef.current) return; // not a render we started
        if (reportedRef.current === renderStatus) return;
        reportedRef.current = renderStatus;
        track("design_rendered", {
            success: renderStatus === "done",
            duration_ms: Date.now() - startedAtRef.current,
            // Frames is what makes the duration readable: a 30s single image
            // and a 30s twelve-slide reel are very different results.
            frames: slideCount,
            reason: renderStatus === "failed" ? renderError || undefined : undefined,
        });
        startedAtRef.current = null;
    }, [renderStatus, renderError, slideCount]);

    return {
        capturing,
        progress: typeof renderProgress === "number" ? renderProgress : null,
        error,
        clearError,
        label,
        startRender,
    };
}
