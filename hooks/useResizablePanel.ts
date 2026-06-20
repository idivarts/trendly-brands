/**
 * useResizablePanel
 *
 * State + math for a user-resizable side panel (web/xl only — see
 * PanelResizeHandle.web.tsx for the gesture layer). The chosen width is stored
 * as a *fraction* of the live container width rather than raw pixels, so it
 * stays proportional when the window / drawer resizes and the 60% cap is
 * expressed naturally. One shared key persists the width across every screen
 * that hosts the RightSidePanel, so the panel feels consistent app-wide.
 */
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

/** Smallest usable panel width — below this Comments/Chat stop being usable. */
export const RIGHT_PANEL_MIN_WIDTH = 360;
/** Hard ceiling: the panel may never exceed 60% of the available width. */
export const RIGHT_PANEL_MAX_FRACTION = 0.6;
/** Default open width ≈ the legacy 1/3 split. */
export const RIGHT_PANEL_DEFAULT_FRACTION = 0.34;

const STORAGE_KEY = "trendly:rightPanel:widthFraction";

const clamp = (value: number, lo: number, hi: number) =>
    Math.min(Math.max(value, lo), hi);

/** Synchronous read on web (avoids a first-paint flash); native hydrates async. */
function readInitialFraction(): number {
    if (Platform.OS === "web") {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? parseFloat(raw) : NaN;
            if (!Number.isNaN(parsed)) {
                return clamp(parsed, 0, RIGHT_PANEL_MAX_FRACTION);
            }
        } catch {
            // localStorage may be unavailable (private mode) — fall through.
        }
    }
    return RIGHT_PANEL_DEFAULT_FRACTION;
}

export interface ResizablePanel {
    /** Pixel width to apply to the panel for the current container width. */
    widthPx: number;
    /** Clamp bounds in px, exposed for ARIA + keyboard stepping. */
    minPx: number;
    maxPx: number;
    /** Commit an absolute target width (px); clamped + persisted internally. */
    commitWidth: (px: number) => void;
    /** Reset to the default width. */
    reset: () => void;
}

export function useResizablePanel(containerWidth: number): ResizablePanel {
    const [fraction, setFraction] = useState<number>(readInitialFraction);

    // Native can't read storage synchronously — hydrate after mount.
    useEffect(() => {
        if (Platform.OS === "web") return;
        let active = true;
        PersistentStorage.get(STORAGE_KEY).then((raw) => {
            const parsed = raw ? parseFloat(raw) : NaN;
            if (active && !Number.isNaN(parsed)) {
                setFraction(clamp(parsed, 0, RIGHT_PANEL_MAX_FRACTION));
            }
        });
        return () => {
            active = false;
        };
    }, []);

    const persist = useCallback((next: number) => {
        PersistentStorage.set(STORAGE_KEY, String(next)).catch(() => {});
    }, []);

    const { widthPx, minPx, maxPx } = useMemo(() => {
        const maxAllowed = Math.max(
            RIGHT_PANEL_MIN_WIDTH,
            containerWidth * RIGHT_PANEL_MAX_FRACTION
        );
        const minAllowed = Math.min(RIGHT_PANEL_MIN_WIDTH, maxAllowed);
        const px =
            containerWidth > 0
                ? clamp(fraction * containerWidth, minAllowed, maxAllowed)
                : RIGHT_PANEL_MIN_WIDTH;
        return { widthPx: px, minPx: minAllowed, maxPx: maxAllowed };
    }, [containerWidth, fraction]);

    const commitWidth = useCallback(
        (px: number) => {
            if (containerWidth <= 0) return;
            const next = clamp(px, minPx, maxPx) / containerWidth;
            setFraction(next);
            persist(next);
        },
        [containerWidth, minPx, maxPx, persist]
    );

    const reset = useCallback(() => {
        setFraction(RIGHT_PANEL_DEFAULT_FRACTION);
        persist(RIGHT_PANEL_DEFAULT_FRACTION);
    }, [persist]);

    return { widthPx, minPx, maxPx, commitWidth, reset };
}
