/**
 * PanelResizeHandle (web)
 *
 * A thin vertical splitter that sits on the LEFT edge of the RightSidePanel.
 * Dragging it left widens the panel, right narrows it; the hook clamps the
 * result to [minPx, 60% of available width]. Fully keyboard-operable
 * (Arrow/Home/End) and double-click resets to the default width.
 *
 * Web-only by construction — the divider itself stays a shadow (per the
 * shadows-over-borders rule); this handle is an interactive *control*, so its
 * 2px hover bar is an affordance, not a separator. All DOM-level wiring (cursor,
 * hover, pointer/keyboard listeners, ARIA) goes through the underlying node so
 * we never depend on react-native style/prop typings that don't model the web.
 */
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PanelResizeHandleProps } from "./PanelResizeHandle.types";

/** Keyboard step sizes (px). Shift takes the larger step. */
const KEY_STEP = 24;
const KEY_STEP_LARGE = 72;

const PanelResizeHandle: React.FC<PanelResizeHandleProps> = (props) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [active, setActive] = useState(false); // hovered or dragging

    // Listeners are registered once on mount; read live props through a ref so
    // they never close over stale width/bounds.
    const propsRef = useRef(props);
    propsRef.current = props;

    const nodeRef = useRef<any>(null);

    useEffect(() => {
        const node: HTMLElement | null = nodeRef.current;
        if (!node) return;

        node.tabIndex = 0;
        node.style.cursor = "col-resize";
        node.setAttribute("role", "separator");
        node.setAttribute("aria-orientation", "vertical");
        node.setAttribute("aria-label", "Resize panel");

        const startDrag = (clientX: number) => {
            const startX = clientX;
            const startWidth = propsRef.current.widthPx;
            setActive(true);
            document.body.style.cursor = "col-resize";
            (document.body.style as any).userSelect = "none";

            const onMove = (e: PointerEvent) => {
                // Handle is on the LEFT edge: moving left → wider panel.
                const delta = startX - e.clientX;
                propsRef.current.onResize(startWidth + delta);
            };
            const onUp = () => {
                setActive(false);
                document.body.style.cursor = "";
                (document.body.style as any).userSelect = "";
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
        };

        const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            startDrag(e.clientX);
        };
        const onDoubleClick = () => propsRef.current.onReset();
        const onEnter = () => setActive(true);
        const onLeave = () => setActive(false);
        const onKeyDown = (e: KeyboardEvent) => {
            const { widthPx, minPx, maxPx, onResize, onReset } = propsRef.current;
            const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    onResize(widthPx + step);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    onResize(widthPx - step);
                    break;
                case "Home":
                    e.preventDefault();
                    onResize(maxPx);
                    break;
                case "End":
                    e.preventDefault();
                    onResize(minPx);
                    break;
                case "Backspace":
                case "Delete":
                    e.preventDefault();
                    onReset();
                    break;
            }
        };

        node.addEventListener("pointerdown", onPointerDown);
        node.addEventListener("dblclick", onDoubleClick);
        node.addEventListener("mouseenter", onEnter);
        node.addEventListener("mouseleave", onLeave);
        node.addEventListener("keydown", onKeyDown);
        return () => {
            node.removeEventListener("pointerdown", onPointerDown);
            node.removeEventListener("dblclick", onDoubleClick);
            node.removeEventListener("mouseenter", onEnter);
            node.removeEventListener("mouseleave", onLeave);
            node.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    // Keep ARIA value attributes current as the width changes.
    useEffect(() => {
        const node: HTMLElement | null = nodeRef.current;
        if (!node) return;
        node.setAttribute("aria-valuemin", String(Math.round(props.minPx)));
        node.setAttribute("aria-valuemax", String(Math.round(props.maxPx)));
        node.setAttribute("aria-valuenow", String(Math.round(props.widthPx)));
    }, [props.widthPx, props.minPx, props.maxPx]);

    const gripStyle = useMemo(
        () => ({ backgroundColor: active ? colors.primary : colors.card }),
        [active, colors.primary, colors.card]
    );
    const dotStyle = useMemo(
        () => ({
            backgroundColor: active ? colors.background : colors.textSecondary,
        }),
        [active, colors.background, colors.textSecondary]
    );

    return (
        <View ref={nodeRef} style={styles.hitArea}>
            {/* Full-height seam line that brightens on hover/drag. */}
            <View
                style={[styles.seam, active && { backgroundColor: colors.primary }]}
                pointerEvents="none"
            />
            {/* Vertically-centred grab pill with grip dots — the visible handle. */}
            <View style={[styles.grip, gripStyle]} pointerEvents="none">
                <View style={[styles.dot, dotStyle]} />
                <View style={[styles.dot, dotStyle]} />
                <View style={[styles.dot, dotStyle]} />
            </View>
        </View>
    );
};

function createStyles(_colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        hitArea: {
            position: "absolute",
            top: 0,
            bottom: 0,
            // Centre the 16px grab target over the panel's left edge (seam).
            left: -8,
            width: 16,
            zIndex: 30,
            alignItems: "center",
            justifyContent: "center",
        },
        seam: {
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "transparent",
        },
        grip: {
            width: 8,
            height: 52,
            borderRadius: 5,
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            // Floats off the seam so it reads as a grabbable control.
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 5,
            shadowOpacity: 0.18,
            elevation: 4,
        },
        dot: {
            width: 3,
            height: 3,
            borderRadius: 1.5,
        },
    });
}

export default PanelResizeHandle;
