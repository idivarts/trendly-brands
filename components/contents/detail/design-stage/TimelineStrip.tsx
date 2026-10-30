/**
 * TimelineStrip — the picture track, drawn to scale, under the player.
 *
 * ── Why a video now has a strip at all ──────────────────────────────────────
 * A design was the whole of a video: one HTML document in, one MP4 out. Every
 * request that needed two kinds of picture — "open on my footage, then the
 * animated stats", "hold on this photo while the voiceover lands" — had no way
 * to be expressed, because there was nowhere to put a second thing. The strip
 * is that somewhere: a sequence of clips, of which the design is one.
 *
 * It is drawn TO SCALE, like the sound lanes above it, because the questions
 * people actually have are proportional ones — is the opening shot too long,
 * does the caption land while the product is on screen. A list of clips with
 * durations typed beside them answers none of them.
 *
 * ── What this component is not ──────────────────────────────────────────────
 * It holds no timeline arithmetic. Offsets, overlaps and the half-clamp on a
 * fade come from `composition-runtime` (shared with the render worker, so the
 * strip and the export cannot disagree), and every edit goes through
 * `composition-edits`. This file lays out rectangles and reports taps.
 */
import { fs, lh } from "@/constants/Typography";
import {
    Clip,
    Composition,
    measureComposition,
    measureOverlays,
} from "@/shared-libs/design/composition-runtime";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faFilm,
    faImage,
    faPenRuler,
    faPlus,
    faVideo,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { clipLabel } from "./composition-edits";

const fmt = (ms: number) => `${(Math.max(ms, 0) / 1000).toFixed(1)}s`;

/** Narrowest a clip tile may be drawn, so a 200ms cut is still tappable. */
const MIN_TILE = 56;
/** The transition chip's own width, which comes out of the scale. */
const CHIP_W = 26;

const ICONS: Record<string, IconDefinition> = {
    design: faPenRuler,
    footage: faFilm,
    image: faImage,
    genvideo: faVideo,
};

/** An entry in the add menu. Passed in so a new clip source is a prop, not an edit here. */
export interface TimelineAction {
    key: string;
    label: string;
    sub?: string;
    icon: IconDefinition;
    onPress: () => void;
}

interface Props {
    composition: Composition;
    /** Null when nothing is selected. Selection drives the inspector. */
    selectedClipId: string | null;
    onSelectClip: (clipId: string | null) => void;
    /** Toggle how a clip enters. Index 0 has nothing to enter from. */
    onToggleTransition: (clipId: string) => void;
    /** What "＋" offers. Empty hides the button. */
    actions: TimelineAction[];
    /**
     * True when a timeline has actually been authored. Until then the strip is
     * showing the implicit one-clip composition every video already had, and
     * saying so is what stops "Reset" reading as a destructive mystery.
     */
    authored: boolean;
    onReset?: () => void;
    readOnly?: boolean;
}

const TimelineStrip: React.FC<Props> = ({
    composition,
    selectedClipId,
    onSelectClip,
    onToggleTransition,
    actions,
    authored,
    onReset,
    readOnly,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [width, setWidth] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    const measured = useMemo(() => measureComposition(composition), [composition]);
    const overlays = useMemo(() => measureOverlays(composition), [composition]);
    const total = measured.totalMs;

    /**
     * Pixels per millisecond.
     *
     * The chips between clips are drawn at a fixed size rather than to scale —
     * a 400ms fade on a 30s reel would otherwise be two pixels wide — so their
     * width comes out of the budget before the clips are laid out. Below that,
     * tiles fall back to their minimum and the strip scrolls.
     */
    const scale = useMemo(() => {
        if (!width || !total) return 0;
        const chips = Math.max(measured.clips.length - 1, 0) * CHIP_W;
        const forClips = Math.max(width - chips - (actions.length ? 44 : 0), MIN_TILE);
        return forClips / total;
    }, [width, total, measured.clips.length, actions.length]);

    const tileWidth = (ms: number) => Math.max(MIN_TILE, Math.round(ms * scale));

    return (
        <View style={styles.wrap}>
            <View style={styles.head}>
                <Text style={styles.label}>TIMELINE</Text>
                <Text style={styles.meta}>
                    {fmt(total)}
                    {measured.clips.length > 1 ? ` · ${measured.clips.length} clips` : ""}
                    {overlays.length ? ` · ${overlays.length} overlay${overlays.length > 1 ? "s" : ""}` : ""}
                </Text>
                {authored && onReset && !readOnly ? (
                    <Pressable
                        onPress={onReset}
                        style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Remove the timeline and go back to the design on its own"
                    >
                        <Text style={styles.resetText}>Back to the design</Text>
                    </Pressable>
                ) : null}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.track}
                onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            >
                {measured.clips.map((m) => {
                    const selected = m.clip.id === selectedClipId;
                    return (
                        <React.Fragment key={m.clip.id}>
                            {m.index > 0 ? (
                                <Pressable
                                    style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                                    onPress={() => !readOnly && onToggleTransition(m.clip.id)}
                                    disabled={readOnly}
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                        m.transition.kind === "fade"
                                            ? `Cross-fade, ${fmt(m.transition.ms)} — tap for a cut`
                                            : "Cut — tap for a cross-fade"
                                    }
                                >
                                    {/* A cut is a line; a fade is a wedge. The
                                        shape is the state — a label at this size
                                        would be two characters of noise. */}
                                    {m.transition.kind === "fade" ? (
                                        <View style={styles.fadeMark} />
                                    ) : (
                                        <View style={styles.cutMark} />
                                    )}
                                </Pressable>
                            ) : null}

                            <Pressable
                                style={({ pressed }) => [
                                    styles.tile,
                                    { width: tileWidth(m.durationMs) },
                                    selected && styles.tileSelected,
                                    pressed && styles.pressed,
                                ]}
                                onPress={() => onSelectClip(selected ? null : m.clip.id)}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                accessibilityLabel={`${clipLabel(m.clip)}, ${fmt(m.durationMs)}`}
                            >
                                <View style={styles.tileHead}>
                                    <FontAwesomeIcon
                                        icon={ICONS[m.clip.source?.kind] ?? faFilm}
                                        size={10}
                                        color={selected ? colors.primary : colors.textSecondary}
                                    />
                                    <Text
                                        style={[styles.tileLabel, selected && styles.tileLabelSelected]}
                                        numberOfLines={1}
                                    >
                                        {clipLabel(m.clip)}
                                    </Text>
                                </View>
                                <Text style={styles.tileMs}>{fmt(m.durationMs)}</Text>
                                {/* A generated clip that has not landed cannot
                                    render, and the strip is where the user will
                                    look for it. */}
                                {m.clip.source?.kind === "genvideo" && !m.clip.source.url ? (
                                    <View style={styles.pendingPip} />
                                ) : null}
                            </Pressable>
                        </React.Fragment>
                    );
                })}

                {actions.length && !readOnly ? (
                    <Pressable
                        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                        onPress={() => (actions.length === 1 ? actions[0].onPress() : setMenuOpen(true))}
                        accessibilityRole="button"
                        accessibilityLabel="Add a clip"
                    >
                        <FontAwesomeIcon icon={faPlus} size={12} color={colors.primary} />
                    </Pressable>
                ) : null}
            </ScrollView>

            {/* Overlays, on their own row and positioned by their AUTHORED start.
                A gap between captions is ordinary — which is exactly why they do
                not share the picture track's derived offsets. */}
            {overlays.length ? (
                <View style={styles.overlayRow}>
                    <Text style={styles.overlayLabel}>ON TOP</Text>
                    <View style={styles.overlayTrack}>
                        {overlays.map((o) => {
                            const selected = o.clip.id === selectedClipId;
                            const left = Math.round(o.startMs * scale);
                            const w = Math.max(18, Math.round(o.durationMs * scale));
                            return (
                                <Pressable
                                    key={o.clip.id}
                                    style={({ pressed }) => [
                                        styles.overlayBar,
                                        { left, width: w },
                                        selected && styles.overlayBarSelected,
                                        pressed && styles.pressed,
                                    ]}
                                    onPress={() => onSelectClip(selected ? null : o.clip.id)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    accessibilityLabel={`Overlay from ${fmt(o.startMs)} to ${fmt(
                                        o.startMs + o.durationMs
                                    )}`}
                                >
                                    <Text style={styles.overlayBarText} numberOfLines={1}>
                                        {fmt(o.startMs)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            ) : null}

            {/* Said plainly, because the canvas above cannot show it: the frame
                plays the DESIGN, and a timeline of several clips only comes
                together in the render. Leaving that implicit would have people
                pressing play and concluding their footage had not been added. */}
            {measured.clips.length > 1 ? (
                <Text style={styles.hint}>
                    The canvas plays your design. The clips come together in the render.
                </Text>
            ) : !readOnly ? (
                <Text style={styles.hint}>
                    One clip: your design. Add footage or a photo and they render in order.
                </Text>
            ) : null}

            <Modal
                visible={menuOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuOpen(false)}
            >
                <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
                    <Pressable style={styles.menu} onPress={() => {}}>
                        <View style={styles.menuHead}>
                            <Text style={styles.menuTitle}>Add a clip</Text>
                            <Pressable
                                onPress={() => setMenuOpen(false)}
                                style={({ pressed }) => [styles.menuClose, pressed && styles.pressed]}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                                hitSlop={8}
                            >
                                <FontAwesomeIcon icon={faXmark} size={13} color={colors.textSecondary} />
                            </Pressable>
                        </View>
                        {actions.map((a) => (
                            <Pressable
                                key={a.key}
                                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
                                onPress={() => {
                                    setMenuOpen(false);
                                    a.onPress();
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={a.label}
                            >
                                <View style={styles.menuIcon}>
                                    <FontAwesomeIcon icon={a.icon} size={13} color={colors.primary} />
                                </View>
                                <View style={styles.menuBody}>
                                    <Text style={styles.menuItemText}>{a.label}</Text>
                                    {a.sub ? <Text style={styles.menuItemSub}>{a.sub}</Text> : null}
                                </View>
                            </Pressable>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

/** Exported for the inspector's header, so both name a clip the same way. */
export const iconForClip = (clip: Clip): IconDefinition =>
    ICONS[clip.source?.kind] ?? faFilm;

const useStyles = (colors: ReturnType<typeof Colors>) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingTop: 8,
                    paddingBottom: 4,
                    backgroundColor: colors.card,
                },
                head: { flexDirection: "row", alignItems: "center", gap: 8 },
                label: {
                    fontSize: fs(9.5),
                    lineHeight: lh(13),
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    color: colors.textSecondary,
                },
                meta: {
                    flex: 1,
                    fontSize: fs(10.5),
                    lineHeight: lh(14),
                    color: colors.textSecondary,
                },
                resetBtn: {
                    paddingVertical: 4,
                    paddingHorizontal: 9,
                    borderRadius: 7,
                    backgroundColor: colors.tag,
                },
                resetText: {
                    fontSize: fs(10.5),
                    lineHeight: lh(14),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                track: { flexDirection: "row", alignItems: "stretch", gap: 0 },
                tile: {
                    height: 46,
                    justifyContent: "center",
                    gap: 2,
                    paddingHorizontal: 7,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                    overflow: "hidden",
                },
                tileSelected: { backgroundColor: withAlpha(colors.primary, 0.16) },
                tileHead: { flexDirection: "row", alignItems: "center", gap: 4 },
                tileLabel: {
                    flex: 1,
                    fontSize: fs(10),
                    lineHeight: lh(13),
                    fontWeight: "700",
                    color: colors.text,
                },
                tileLabelSelected: { color: colors.primary },
                tileMs: {
                    fontSize: fs(9.5),
                    lineHeight: lh(12),
                    color: colors.textSecondary,
                },
                pendingPip: {
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.primary,
                },
                chip: {
                    width: CHIP_W,
                    alignItems: "center",
                    justifyContent: "center",
                },
                cutMark: {
                    width: 2,
                    height: 20,
                    borderRadius: 1,
                    backgroundColor: colors.textSecondary,
                },
                fadeMark: {
                    width: 14,
                    height: 20,
                    borderRadius: 3,
                    backgroundColor: withAlpha(colors.primary, 0.45),
                },
                addBtn: {
                    width: 38,
                    height: 46,
                    marginLeft: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                overlayRow: { flexDirection: "row", alignItems: "center", gap: 8 },
                overlayLabel: {
                    fontSize: fs(9),
                    lineHeight: lh(12),
                    fontWeight: "800",
                    letterSpacing: 0.7,
                    color: colors.textSecondary,
                },
                overlayTrack: { flex: 1, height: 22, justifyContent: "center" },
                overlayBar: {
                    position: "absolute",
                    height: 20,
                    justifyContent: "center",
                    paddingHorizontal: 5,
                    borderRadius: 6,
                    backgroundColor: withAlpha(colors.primary, 0.22),
                    overflow: "hidden",
                },
                overlayBarSelected: { backgroundColor: colors.primary },
                overlayBarText: {
                    fontSize: fs(9),
                    lineHeight: lh(12),
                    fontWeight: "700",
                    color: colors.text,
                },
                hint: {
                    fontSize: fs(10.5),
                    lineHeight: lh(14),
                    color: colors.textSecondary,
                },
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                },
                menu: {
                    width: "100%",
                    maxWidth: 360,
                    gap: 6,
                    borderRadius: 14,
                    backgroundColor: colors.card,
                    padding: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowRadius: 24,
                    shadowOpacity: 0.2,
                    elevation: 12,
                },
                menuHead: { flexDirection: "row", alignItems: "center" },
                menuTitle: {
                    flex: 1,
                    fontSize: fs(14),
                    lineHeight: lh(19),
                    fontWeight: "800",
                    color: colors.text,
                },
                menuClose: { padding: 4 },
                menuItem: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                },
                menuIcon: {
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.card,
                },
                menuBody: { flex: 1, gap: 1 },
                menuItemText: {
                    fontSize: fs(12.5),
                    lineHeight: lh(17),
                    fontWeight: "700",
                    color: colors.text,
                },
                menuItemSub: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                },
                pressed: { opacity: 0.75 },
            }),
        [colors]
    );

export default TimelineStrip;
