/**
 * What a v3 design's state means, in the user's terms.
 *
 * ── Why this is a module and not a function in the screen ──────────────────
 * These rules decide what the user is told about work that is happening
 * somewhere else, and getting them wrong is invisible: a design that finished
 * reads as still running, or a failure reads as success. That is worth tests,
 * and this app has jest but no React Native renderer — importing a screen
 * pulls in the whole RN tree and fails. So the rules live here, beside the
 * components that use them, in the same shape as the studio's scene-progress
 * and inspector-tabs modules.
 */

export type DesignRenderStatus = "queued" | "rendering" | "done" | "failed";
export type DesignAuthorStatus = "queued" | "writing" | "done" | "failed";
export type DesignPreviewStatus = "queued" | "running" | "done" | "failed";

/** One still from the film, and where in it the frame is. */
export interface DesignPreviewFrame {
    url: string;
    timeMs: number;
}

/** The shape these rules need. Both screens' row/detail types satisfy it. */
export interface DesignStatusFields {
    format?: { width: number; height: number; fps: number };
    durationMs?: number;
    projectPrefix?: string;
    authorStatus?: DesignAuthorStatus;
    authorError?: string;
    previewStatus?: DesignPreviewStatus;
    previewError?: string;
    previewFrames?: DesignPreviewFrame[];
    renderStatus?: DesignRenderStatus;
    renderError?: string;
    renderUrl?: string;
}

export const isAuthoring = (d: DesignStatusFields | null | undefined): boolean =>
    d?.authorStatus === "queued" || d?.authorStatus === "writing";

export const isRendering = (d: DesignStatusFields | null | undefined): boolean =>
    d?.renderStatus === "queued" || d?.renderStatus === "rendering";

export const isPreviewing = (d: DesignStatusFields | null | undefined): boolean =>
    d?.previewStatus === "queued" || d?.previewStatus === "running";

/**
 * Whether the user has actually SEEN this design.
 *
 * The question Phase 3 exists to answer. Rendering is the expensive step, and
 * approving something you have not looked at is not approval — so the Render
 * button leads with the preview until there is something to have looked at.
 * A design that has already been rendered counts: the film itself is on
 * screen, which is a better look than any filmstrip.
 */
export const hasBeenSeen = (d: DesignStatusFields | null | undefined): boolean =>
    (d?.previewFrames?.length ?? 0) > 0 || !!d?.renderUrl;

export interface DesignStatus {
    /** One short line, for a list row. */
    text: string;
    /** A longer line that may carry the real error, for the detail screen. */
    detail: string;
    busy: boolean;
    bad: boolean;
}

/**
 * Collapses two independent pieces of state into one sentence.
 *
 * Authoring and rendering can each be in flight and the document carries both,
 * so showing one line means ranking them. Writing comes first because a design
 * being written has nothing to render yet — and a FAILED write outranks a
 * stale successful render for the same reason: the user is looking at the
 * result of a request that did not work.
 */
export function designStatus(d: DesignStatusFields | null | undefined): DesignStatus {
    if (!d) return { text: "", detail: "", busy: false, bad: false };

    if (isAuthoring(d)) {
        return { text: "Writing…", detail: "Writing the design…", busy: true, bad: false };
    }
    if (d.authorStatus === "failed") {
        const why = d.authorError || "Writing failed.";
        return { text: "Writing failed", detail: why, busy: false, bad: true };
    }
    if (isRendering(d)) {
        return { text: "Rendering…", detail: "Rendering…", busy: true, bad: false };
    }
    if (d.renderStatus === "failed") {
        const why = d.renderError || "The render failed.";
        return { text: "Render failed", detail: why, busy: false, bad: true };
    }
    if (d.renderStatus === "done") {
        return { text: "Ready", detail: "Ready.", busy: false, bad: false };
    }

    // Preview ranks BELOW the render, unlike authoring, because it is not on
    // the way to anything: a design with a finished render does not become
    // more interesting for having a filmstrip too. It ranks above the
    // written-but-unrendered line, since taking frames is what the user is
    // waiting on at that point.
    if (isPreviewing(d)) {
        return { text: "Previewing…", detail: "Taking a look at the film…", busy: true, bad: false };
    }
    if (d.previewStatus === "failed") {
        const why = d.previewError || "We could not preview this design.";
        return { text: "Preview failed", detail: why, busy: false, bad: true };
    }

    if (!d.projectPrefix) {
        return {
            text: "Empty",
            detail: "Nothing in it yet — describe the film below.",
            busy: false,
            bad: false,
        };
    }
    if ((d.previewFrames?.length ?? 0) > 0) {
        return {
            text: "Previewed",
            detail: "Have a look, then render it when you're happy.",
            busy: false,
            bad: false,
        };
    }
    return { text: "Not rendered", detail: "Written, but not rendered yet.", busy: false, bad: false };
}

/** "10s · 1080×1920", or "" when the canvas is not known yet. */
export function designFormatLabel(d: DesignStatusFields | null | undefined): string {
    const width = d?.format?.width ?? 0;
    const height = d?.format?.height ?? 0;
    if (!width || !height) return "";
    const seconds = d?.durationMs ? `${Math.round(d.durationMs / 1000)}s · ` : "";
    return `${seconds}${width}×${height}`;
}

/** The canvas's aspect ratio, defaulting to vertical video. */
export function designAspect(d: DesignStatusFields | null | undefined): number {
    const width = d?.format?.width ?? 0;
    const height = d?.format?.height ?? 0;
    if (!width || !height) return 9 / 16;
    return width / height;
}

export type DesignGate = "tokens_exhausted" | "plan_locked" | null;

/**
 * Which wall, if any, stands between the user and a render.
 *
 * The backend's own refusal outranks the local wallet read, because the wallet
 * may have emptied since the screen hydrated — and because only the backend
 * knows whether the refusal was an empty wallet or a plan that never allowed
 * this at all. With no refusal yet, an exhausted wallet is caught here so the
 * user is not invited to press a button that can only be refused.
 */
export function resolveDesignGate(
    backendReason: string | null | undefined,
    tokenState: string | null | undefined
): DesignGate {
    if (backendReason === "tokens_exhausted") return "tokens_exhausted";
    if (backendReason) return "plan_locked";
    if (tokenState === "exhausted") return "tokens_exhausted";
    return null;
}
