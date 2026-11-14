/**
 * The grab bar between two panes.
 *
 * ── Why this is raw pointer events and not a gesture library ─────────────
 * Two libraries were tried and measured here, and the measurements are
 * the reason this file looks plainer than StudioTimeline:
 *
 *  1. PanResponder reports an undefined locationX on react-native-web and
 *     its release never fires for a mouse drag — the same three failures
 *     the timeline hit.
 *  2. react-native-gesture-handler works for the timeline, where a clip is
 *     wide enough that the pointer stays over it. It did NOT drive this
 *     one. A 10px bar loses the pointer immediately, and even with the
 *     capture below putting every later event back on the element —
 *     verified: pointerdown, gotpointercapture, pointermove, pointermove,
 *     pointerup all arrive — the pan never moved the panes.
 *
 * What DOES arrive, reliably and measurably, is the pointer events. So
 * the divider uses them directly. A resize is one number tracked along one
 * axis; it does not need a recogniser, and a handle that is drawn and does
 * nothing is worse than no handle at all.
 *
 * ── Why it is wider than it looks ─────────────────────────────────────────
 * A 1px line is honest about where the boundary is and impossible to hit.
 * The bar is 10px of grab area with a 2px line down the middle, so the
 * thing you see is the boundary and the thing you grab is reachable.
 */
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";

export interface PaneDividerProps {
    /** The pane's width when the drag starts. */
    width: number;
    /**
     * Which way widening goes. The LEFT pane grows as the finger moves
     * right; the RIGHT pane grows as it moves left, so its delta is
     * negated here rather than at every call site.
     */
    side: "left" | "right";
    /** Called continuously while dragging, with the proposed width. */
    onResize: (width: number) => void;
    /** Called once on release, so the layout is stored then and not on every frame. */
    onSettle: (width: number) => void;
}

/** How wide the grab area is. */
const DIVIDER_W = 10;

const PaneDivider: React.FC<PaneDividerProps> = ({ width, side, onResize, onSettle }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // Read inside the handlers, which must see the CURRENT width and
    // callbacks rather than the first render's — the mistake the timeline's
    // clip drag made before it was rewritten.
    const live = useRef({ width, side, onResize, onSettle });
    live.current = { width, side, onResize, onSettle };

    /** The gesture in flight: where it started, and from what width. */
    const drag = useRef<{ x: number; from: number } | null>(null);

    const deltaFor = (clientX: number) => {
        const d = drag.current;
        if (!d) return null;
        const dx = clientX - d.x;
        return d.from + (live.current.side === "left" ? dx : -dx);
    };

    const onDown = useCallback((e: any) => {
        const ne = e?.nativeEvent ?? {};
        const x = typeof ne.clientX === "number" ? ne.clientX : ne.pageX;
        if (typeof x !== "number") return;
        drag.current = { x, from: live.current.width };
        // ⚠️ Without this the pointer leaves the 10px bar on the first move
        // and every later event retargets to whatever is underneath — so
        // the drag is a press that does nothing. Capturing pins them here
        // for the life of the gesture. Web only; a no-op elsewhere.
        const target = ne.target as { setPointerCapture?: (id: number) => void } | undefined;
        if (typeof ne.pointerId === "number" && typeof target?.setPointerCapture === "function") {
            try {
                target.setPointerCapture(ne.pointerId);
            } catch {
                // A browser that refuses capture still drags while the
                // pointer stays on the bar. Not worth an error.
            }
        }
    }, []);

    const onMove = useCallback((e: any) => {
        if (!drag.current) return;
        const ne = e?.nativeEvent ?? {};
        const x = typeof ne.clientX === "number" ? ne.clientX : ne.pageX;
        if (typeof x !== "number") return;
        const next = deltaFor(x);
        if (next !== null) live.current.onResize(next);
    }, []);

    const onUp = useCallback((e: any) => {
        if (!drag.current) return;
        const ne = e?.nativeEvent ?? {};
        const x = typeof ne.clientX === "number" ? ne.clientX : ne.pageX;
        const next = typeof x === "number" ? deltaFor(x) : drag.current.from;
        drag.current = null;
        if (next !== null) live.current.onSettle(next);
    }, []);

    return (
        <View style={styles.slot}>
            <View
                style={styles.bar}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                accessibilityRole="adjustable"
                accessibilityLabel={`Resize the ${side} panel`}
            >
                <View style={styles.line} pointerEvents="none" />
            </View>
        </View>
    );
};

export default PaneDivider;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                // The space the divider occupies in the row. Never shrinks:
                // a flex row is free to squeeze a 10px child to nothing when
                // it is tight, which is exactly when the handle matters.
                slot: { width: DIVIDER_W, flexGrow: 0, flexShrink: 0, zIndex: 3 },
                bar: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    // Web only, and harmless elsewhere: without it the
                    // pointer stays an arrow and nothing says the boundary
                    // can be moved.
                    ...Platform.select({ web: { cursor: "col-resize" } as object, default: {} }),
                },
                line: {
                    width: 2,
                    alignSelf: "stretch",
                    marginVertical: 8,
                    borderRadius: 1,
                    backgroundColor: withAlpha(colors.text, 0.12),
                },
            }),
        [colors]
    );
}
