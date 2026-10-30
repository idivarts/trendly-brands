/**
 * ClipInspector — the properties of the clip selected on the timeline.
 *
 * The strip answers "what is where"; this answers "what is this one". They are
 * deliberately separate: a strip that tries to hold trim handles, a speed
 * control and a transcript becomes unusable at the width a 10-second clip
 * occupies, and a panel that also lays out the sequence cannot be read beside
 * the canvas.
 *
 * ── The footage body is the point of Phase 9 ────────────────────────────────
 * Everything else here is a handful of numbers. Footage is the one clip kind
 * that was READ when it arrived — its length and dimensions measured, its
 * speech transcribed with per-word timings, its shots described from sampled
 * frames — and that is what makes an editor out of a trim box:
 *
 *  - striking words out of the transcript CUTS that window of the take, which
 *    is a split when it lands in the middle;
 *  - a described shot is a tappable trim, so "the bit where she picks up the
 *    cup" is one tap rather than a hunt with two time fields;
 *  - a video still being read says so, because ingest finishes a minute or two
 *    after the upload and an empty transcript otherwise reads as "no speech".
 *
 * It holds no timeline arithmetic. Every edit goes through `composition-edits`,
 * which is what the render worker's arithmetic is tested against.
 */
import { fs, lh } from "@/constants/Typography";
import {
    Clip,
    Composition,
    DesignClipSource,
    FootageClipSource,
    GenVideoClipSource,
    ImageClipSource,
    measureComposition,
} from "@/shared-libs/design/composition-runtime";
import { ITranscriptWord } from "@/shared-libs/firestore/trendly-pro/models/asset";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faArrowLeft,
    faArrowRight,
    faScissors,
    faTrashCan,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
    MIN_CLIP_MS,
    cutFootageRange,
    findClip,
    moveClip,
    patchClipSource,
    patchFootage,
    removeClip,
    setClipDuration,
    setOverlayWindow,
    setTransition,
    clipLabel,
} from "./composition-edits";
import { iconForClip } from "./TimelineStrip";
import { useFootageAsset } from "./use-footage-asset";

const fmt = (ms: number) => `${(Math.max(ms, 0) / 1000).toFixed(1)}s`;

/** How much a ± button moves a length or a trim point. */
const NUDGE_MS = 250;

/**
 * The inspector's three building blocks, defined at MODULE level on purpose.
 *
 * Declared inside the component they would be a new component type on every
 * render, so React would unmount and remount the whole subtree for each tap —
 * losing any state inside them and, the day somebody puts a TextInput in one,
 * the keyboard focus with it.
 */
const Row: React.FC<{
    label: string;
    styles: ReturnType<typeof useStyles>;
    children: React.ReactNode;
}> = ({ label, styles, children }) => (
    <>
        <Text style={styles.label}>{label}</Text>
        {children}
    </>
);

const Chips: React.FC<{
    options: { value: string; label: string }[];
    value: string;
    onPick: (v: string) => void;
    styles: ReturnType<typeof useStyles>;
    readOnly?: boolean;
}> = ({ options, value, onPick, styles, readOnly }) => (
    <View style={styles.chips}>
        {options.map((o) => {
            const active = o.value === value;
            return (
                <Pressable
                    key={o.value}
                    style={({ pressed }) => [
                        styles.chip,
                        active && styles.chipActive,
                        pressed && styles.pressed,
                    ]}
                    onPress={() => !readOnly && onPick(o.value)}
                    disabled={readOnly}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={o.label}
                >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                </Pressable>
            );
        })}
    </View>
);

const Stepper: React.FC<{
    value: string;
    onStep: (dir: -1 | 1) => void;
    label: string;
    styles: ReturnType<typeof useStyles>;
    readOnly?: boolean;
}> = ({ value, onStep, label, styles, readOnly }) => (
    <View style={styles.stepper}>
        <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            onPress={() => !readOnly && onStep(-1)}
            disabled={readOnly}
            accessibilityRole="button"
            accessibilityLabel={`${label} — less`}
        >
            <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            onPress={() => !readOnly && onStep(1)}
            disabled={readOnly}
            accessibilityRole="button"
            accessibilityLabel={`${label} — more`}
        >
            <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
    </View>
);

interface Props {
    composition: Composition;
    clipId: string;
    /** Scenes in the design, so a design clip can be pinned to one of them. */
    designSceneCount: number;
    onChange: (next: Composition) => void;
    onDeselect: () => void;
    /** Hand the clip to the AI chat with an instruction already written. */
    onAskAI?: (instruction: string) => void;
    readOnly?: boolean;
}

const ClipInspector: React.FC<Props> = ({
    composition,
    clipId,
    designSceneCount,
    onChange,
    onDeselect,
    onAskAI,
    readOnly,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const found = useMemo(() => findClip(composition, clipId), [composition, clipId]);
    const measured = useMemo(() => measureComposition(composition), [composition]);

    const clip = found?.clip;
    const isOverlay = found?.track === "overlay";
    const source = clip?.source;
    const footage = source?.kind === "footage" ? (source as FootageClipSource) : null;

    const { asset } = useFootageAsset(footage?.assetId);
    const assetMs = asset?.durationMs ?? asset?.ingest?.durationMs;

    // A transcript selection is a pair of token indices, inclusive, in the
    // order they were tapped — second tap before the first still selects the
    // span between them.
    const [sel, setSel] = useState<[number, number] | null>(null);

    const words: ITranscriptWord[] = asset?.ingest?.words ?? [];

    const onWordTap = useCallback(
        (i: number) => {
            setSel((cur) => {
                if (!cur) return [i, i];
                // Tapping inside the current selection clears it, which is the
                // only way back out without a second control.
                if (i >= Math.min(...cur) && i <= Math.max(...cur)) return null;
                return [cur[0], i];
            });
        },
        []
    );

    const selRange = useMemo(() => {
        if (!sel || !words.length) return null;
        const a = Math.min(sel[0], sel[1]);
        const b = Math.max(sel[0], sel[1]);
        const from = words[a]?.startMs;
        const to = words[b]?.endMs;
        if (from === undefined || to === undefined || to <= from) return null;
        return { from, to, count: b - a + 1 };
    }, [sel, words]);

    if (!clip || !source) {
        return (
            <View style={styles.body}>
                <Text style={styles.empty}>That clip is no longer on the timeline.</Text>
            </View>
        );
    }

    const index = measured.clips.findIndex((m) => m.clip.id === clipId);
    const canMoveBack = index > 0;
    const canMoveOn = index >= 0 && index < measured.clips.length - 1;
    const removable = isOverlay || measured.clips.length > 1;
    const transition = clip.transitionIn?.kind === "fade" ? "fade" : "cut";

    const apply = (next: Composition) => {
        if (readOnly) return;
        onChange(next);
    };

    return (
        <View style={styles.body}>
            <View style={styles.head}>
                <FontAwesomeIcon icon={iconForClip(clip)} size={12} color={colors.primary} />
                <Text style={styles.title} numberOfLines={1}>
                    {clipLabel(clip)}
                </Text>
                <Pressable
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                    onPress={onDeselect}
                    accessibilityRole="button"
                    accessibilityLabel="Clear the clip selection"
                >
                    <FontAwesomeIcon icon={faXmark} size={11} color={colors.textSecondary} />
                </Pressable>
            </View>

            {/* ── Length ──
                Footage is the exception: its length follows its trim and its
                speed, so it is shown rather than edited. Editing both would let
                a clip declare four seconds over a window holding two, which
                renders as a freeze-frame nobody asked for. */}
            {footage ? (
                <Row label="On screen" styles={styles}>
                    <Text style={styles.readout}>
                        {fmt(clip.durationMs)}
                        <Text style={styles.readoutSub}> — from the trim below</Text>
                    </Text>
                </Row>
            ) : (
                <Row label="Length" styles={styles}>
                    <Stepper
                        styles={styles}
                        readOnly={readOnly}
                        label="Length"
                        value={fmt(clip.durationMs)}
                        onStep={(d) =>
                            apply(setClipDuration(composition, clipId, clip.durationMs + d * NUDGE_MS))
                        }
                    />
                </Row>
            )}

            {isOverlay ? (
                <Row label="Starts at" styles={styles}>
                    <Stepper
                        styles={styles}
                        readOnly={readOnly}
                        label="Start"
                        value={fmt(clip.startMs ?? 0)}
                        onStep={(d) =>
                            apply(
                                setOverlayWindow(
                                    composition,
                                    clipId,
                                    (clip.startMs ?? 0) + d * NUDGE_MS,
                                    clip.durationMs
                                )
                            )
                        }
                    />
                </Row>
            ) : null}

            {/* ── How it enters ──
                Only from the second clip on: the first has nothing behind it to
                fade from, which the runtime normalizes to a cut anyway. */}
            {!isOverlay && index > 0 ? (
                <Row label="Enters" styles={styles}>
                    <>
                        <Chips
                            styles={styles}
                            readOnly={readOnly}
                            value={transition}
                            onPick={(v) =>
                                apply(setTransition(composition, clipId, v === "fade" ? "fade" : "cut"))
                            }
                            options={[
                                { value: "cut", label: "Cut" },
                                { value: "fade", label: "Cross-fade" },
                            ]}
                        />
                        {transition === "fade" ? (
                            <>
                                <Stepper
                        styles={styles}
                        readOnly={readOnly}
                                    label="Fade length"
                                    value={fmt(clip.transitionIn?.ms ?? 0)}
                                    onStep={(d) =>
                                        apply(
                                            setTransition(
                                                composition,
                                                clipId,
                                                "fade",
                                                (clip.transitionIn?.ms ?? 0) + d * 100
                                            )
                                        )
                                    }
                                />
                                {/* The runtime caps an overlap at half the
                                    shorter clip. Saying so beats a number that
                                    silently stops having an effect. */}
                                {measured.clips[index] &&
                                measured.clips[index].transition.ms < (clip.transitionIn?.ms ?? 0) ? (
                                    <Text style={styles.note}>
                                        Capped at {fmt(measured.clips[index].transition.ms)} — a fade
                                        can't be longer than half the shorter clip.
                                    </Text>
                                ) : null}
                            </>
                        ) : null}
                    </>
                </Row>
            ) : null}

            {/* ── Per-kind ── */}
            {source.kind === "design" && designSceneCount > 1 ? (
                <Row label="Shows" styles={styles}>
                    <Chips
                            styles={styles}
                            readOnly={readOnly}
                        value={
                            (source as DesignClipSource).sceneIndex === undefined ||
                            (source as DesignClipSource).sceneIndex === null
                                ? "all"
                                : String((source as DesignClipSource).sceneIndex)
                        }
                        onPick={(v) =>
                            apply(
                                patchClipSource<DesignClipSource>(composition, clipId, {
                                    // `undefined` is the whole design, scene
                                    // transitions included — the thing every
                                    // video design was before timelines.
                                    sceneIndex: v === "all" ? undefined : Number(v),
                                })
                            )
                        }
                        options={[
                            { value: "all", label: "Whole design" },
                            ...Array.from({ length: designSceneCount }, (_, i) => ({
                                value: String(i),
                                label: `Scene ${i + 1}`,
                            })),
                        ]}
                    />
                </Row>
            ) : null}

            {source.kind === "image" ? (
                <Row label="Motion" styles={styles}>
                    <Chips
                            styles={styles}
                            readOnly={readOnly}
                        value={(source as ImageClipSource).kenBurns ?? "none"}
                        onPick={(v) =>
                            apply(
                                patchClipSource<ImageClipSource>(composition, clipId, {
                                    kenBurns: v as ImageClipSource["kenBurns"],
                                })
                            )
                        }
                        options={[
                            { value: "in", label: "Push in" },
                            { value: "out", label: "Pull out" },
                            { value: "none", label: "Still" },
                        ]}
                    />
                </Row>
            ) : null}

            {source.kind === "genvideo" ? (
                <>
                    <Row label="Prompt" styles={styles}>
                        <Text style={styles.readout}>{(source as GenVideoClipSource).prompt}</Text>
                    </Row>
                    <Text style={styles.note}>
                        {(source as GenVideoClipSource).url
                            ? "This clip has landed and will render."
                            : "Still generating. The clip can't render until it lands — we'll drop it in when it does."}
                    </Text>
                </>
            ) : null}

            {footage ? (
                <>
                    {/* ── Trim ── in and out are SOURCE time, so they are the
                        same clock the transcript and the shots are on. */}
                    <Row label="Starts at" styles={styles}>
                        <Stepper
                        styles={styles}
                        readOnly={readOnly}
                            label="In point"
                            value={fmt(footage.inMs ?? 0)}
                            onStep={(d) =>
                                apply(
                                    patchFootage(
                                        composition,
                                        clipId,
                                        { inMs: Math.max(0, (footage.inMs ?? 0) + d * NUDGE_MS) },
                                        assetMs
                                    )
                                )
                            }
                        />
                    </Row>
                    <Row label="Ends at" styles={styles}>
                        <Stepper
                        styles={styles}
                        readOnly={readOnly}
                            label="Out point"
                            value={fmt(footage.outMs ?? assetMs ?? 0)}
                            onStep={(d) =>
                                apply(
                                    patchFootage(
                                        composition,
                                        clipId,
                                        {
                                            outMs: Math.max(
                                                (footage.inMs ?? 0) + MIN_CLIP_MS,
                                                Math.min(
                                                    assetMs ?? Number.MAX_SAFE_INTEGER,
                                                    (footage.outMs ?? assetMs ?? 0) + d * NUDGE_MS
                                                )
                                            ),
                                        },
                                        assetMs
                                    )
                                )
                            }
                        />
                    </Row>

                    <Row label="Speed" styles={styles}>
                        <Chips
                            styles={styles}
                            readOnly={readOnly}
                            value={String(footage.speed ?? 1)}
                            onPick={(v) =>
                                apply(patchFootage(composition, clipId, { speed: Number(v) }, assetMs))
                            }
                            options={[
                                { value: "0.5", label: "½×" },
                                { value: "1", label: "1×" },
                                { value: "1.5", label: "1.5×" },
                                { value: "2", label: "2×" },
                            ]}
                        />
                    </Row>

                    {/* Muted by default when a clip is placed, so it cannot talk
                        over a music bed the user already chose. */}
                    <Row label="Its own sound" styles={styles}>
                        <Chips
                            styles={styles}
                            readOnly={readOnly}
                            value={String(footage.volume ?? 0)}
                            onPick={(v) =>
                                apply(patchFootage(composition, clipId, { volume: Number(v) }, assetMs))
                            }
                            options={[
                                { value: "0", label: "Muted" },
                                { value: "0.5", label: "Half" },
                                { value: "1", label: "Full" },
                            ]}
                        />
                    </Row>

                    {asset?.ingest?.status === "pending" ? (
                        <Text style={styles.note}>
                            Reading this video — the transcript and the shots arrive in a minute or
                            two. You can trim it by hand meanwhile.
                        </Text>
                    ) : null}

                    {asset?.ingest?.status === "failed" ? (
                        <Text style={styles.note}>
                            We couldn't read this one, so there's no transcript. The trim above still
                            works.
                        </Text>
                    ) : null}

                    {/* ── Shots ──
                        A described shot is a trim you can tap. This is the whole
                        reason the frames were sampled and sent to a model. */}
                    {asset?.ingest?.shots?.length ? (
                        <Row label="Shots" styles={styles}>
                            <View style={styles.shots}>
                                {asset.ingest.shots.map((shot, i) => (
                                    <Pressable
                                        key={`${shot.startMs}-${i}`}
                                        style={({ pressed }) => [styles.shot, pressed && styles.pressed]}
                                        onPress={() =>
                                            apply(
                                                patchFootage(
                                                    composition,
                                                    clipId,
                                                    { inMs: shot.startMs, outMs: shot.endMs },
                                                    assetMs
                                                )
                                            )
                                        }
                                        disabled={readOnly}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Trim to this shot: ${shot.description}`}
                                    >
                                        <Text style={styles.shotTime}>
                                            {fmt(shot.startMs)}–{fmt(shot.endMs)}
                                        </Text>
                                        <Text style={styles.shotText} numberOfLines={3}>
                                            {shot.description}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </Row>
                    ) : null}

                    {/* ── Transcript ──
                        Tap a word to start a span, tap another to close it, tap
                        inside it to clear. Cutting the span removes that window
                        of the take — a split when it lands in the middle. */}
                    {words.length ? (
                        <Row label="Transcript" styles={styles}>
                            <>
                                <View style={styles.transcript}>
                                    {words.map((w, i) => {
                                        const inSel =
                                            !!sel &&
                                            i >= Math.min(sel[0], sel[1]) &&
                                            i <= Math.max(sel[0], sel[1]);
                                        // A spacing token is a pause. It is
                                        // selectable, so a span can take the
                                        // silence around it with it.
                                        const isGap = w.kind === "spacing";
                                        return (
                                            <Pressable
                                                key={`${w.startMs}-${i}`}
                                                style={({ pressed }) => [
                                                    isGap ? styles.gap : styles.word,
                                                    inSel && styles.wordSelected,
                                                    pressed && styles.pressed,
                                                ]}
                                                onPress={() => onWordTap(i)}
                                                disabled={readOnly}
                                                accessibilityRole="button"
                                                accessibilityLabel={
                                                    isGap ? "A pause" : `${w.text}, at ${fmt(w.startMs)}`
                                                }
                                            >
                                                {isGap ? (
                                                    <View style={styles.gapDot} />
                                                ) : (
                                                    <Text
                                                        style={[
                                                            styles.wordText,
                                                            inSel && styles.wordTextSelected,
                                                        ]}
                                                    >
                                                        {w.text}
                                                    </Text>
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                {selRange ? (
                                    <Pressable
                                        style={({ pressed }) => [styles.cutBtn, pressed && styles.pressed]}
                                        onPress={() => {
                                            apply(
                                                cutFootageRange(
                                                    composition,
                                                    clipId,
                                                    selRange.from,
                                                    selRange.to,
                                                    assetMs
                                                )
                                            );
                                            setSel(null);
                                        }}
                                        disabled={readOnly}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Cut ${selRange.count} words, ${fmt(
                                            selRange.to - selRange.from
                                        )}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faScissors}
                                            size={11}
                                            color={colors.onPrimary}
                                        />
                                        <Text style={styles.cutBtnText}>
                                            Cut {fmt(selRange.to - selRange.from)}
                                        </Text>
                                    </Pressable>
                                ) : (
                                    <Text style={styles.note}>
                                        Tap a word, then another, to cut everything between them.
                                    </Text>
                                )}
                            </>
                        </Row>
                    ) : null}
                </>
            ) : null}

            {/* ── Order and removal ── */}
            {!readOnly ? (
                <View style={styles.actions}>
                    {!isOverlay ? (
                        <>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionBtn,
                                    !canMoveBack && styles.btnDisabled,
                                    pressed && styles.pressed,
                                ]}
                                onPress={() => apply(moveClip(composition, clipId, -1))}
                                disabled={!canMoveBack}
                                accessibilityRole="button"
                                accessibilityLabel="Move this clip earlier"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} size={11} color={colors.textSecondary} />
                                <Text style={styles.actionTextMuted}>Earlier</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionBtn,
                                    !canMoveOn && styles.btnDisabled,
                                    pressed && styles.pressed,
                                ]}
                                onPress={() => apply(moveClip(composition, clipId, 1))}
                                disabled={!canMoveOn}
                                accessibilityRole="button"
                                accessibilityLabel="Move this clip later"
                            >
                                <FontAwesomeIcon icon={faArrowRight} size={11} color={colors.textSecondary} />
                                <Text style={styles.actionTextMuted}>Later</Text>
                            </Pressable>
                        </>
                    ) : null}
                    {onAskAI ? (
                        <Pressable
                            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                            onPress={() =>
                                onAskAI(
                                    `On the timeline, ${clipLabel(clip).toLowerCase()} (clip ${index + 1}, ${fmt(
                                        clip.durationMs
                                    )}): `
                                )
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Ask the AI about this clip"
                        >
                            <FontAwesomeIcon
                                icon={faWandMagicSparkles}
                                size={11}
                                color={colors.primary}
                            />
                            <Text style={styles.actionText}>Ask AI</Text>
                        </Pressable>
                    ) : null}
                    {/* The last picture clip is not removable: a timeline with
                        no picture cannot render, and clearing the media is the
                        honest way to have none. */}
                    {removable ? (
                        <Pressable
                            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                            onPress={() => {
                                apply(removeClip(composition, clipId));
                                onDeselect();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Remove this clip from the timeline"
                        >
                            <FontAwesomeIcon icon={faTrashCan} size={11} color={colors.textSecondary} />
                            <Text style={styles.actionTextMuted}>Remove</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                body: { gap: 6 },
                head: { flexDirection: "row", alignItems: "center", gap: 7 },
                title: {
                    flex: 1,
                    fontSize: fs(12.5),
                    lineHeight: lh(17),
                    fontWeight: "800",
                    color: colors.text,
                },
                iconBtn: {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                },
                label: {
                    fontSize: fs(10),
                    lineHeight: lh(13),
                    fontWeight: "700",
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    color: colors.textSecondary,
                    marginTop: 8,
                },
                readout: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.text,
                },
                readoutSub: {
                    fontSize: fs(11),
                    color: colors.textSecondary,
                },
                note: {
                    fontSize: fs(10.5),
                    lineHeight: lh(14),
                    color: colors.textSecondary,
                    marginTop: 4,
                },
                empty: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                },
                chips: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
                chip: {
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                chipActive: { backgroundColor: colors.primary },
                chipText: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                chipTextActive: { color: colors.onPrimary },
                stepper: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    alignSelf: "flex-start",
                    paddingHorizontal: 4,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                stepBtn: {
                    width: 26,
                    height: 26,
                    alignItems: "center",
                    justifyContent: "center",
                },
                stepBtnText: {
                    fontSize: fs(14),
                    lineHeight: lh(18),
                    fontWeight: "800",
                    color: colors.primary,
                },
                stepValue: {
                    minWidth: 46,
                    textAlign: "center",
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: colors.text,
                },
                shots: { gap: 5 },
                shot: {
                    gap: 2,
                    padding: 8,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                shotTime: {
                    fontSize: fs(9.5),
                    lineHeight: lh(13),
                    fontWeight: "800",
                    color: colors.primary,
                },
                shotText: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.text,
                },
                transcript: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 3,
                },
                word: {
                    paddingVertical: 2,
                    paddingHorizontal: 5,
                    borderRadius: 5,
                    backgroundColor: colors.tag,
                },
                wordSelected: { backgroundColor: colors.primary },
                wordText: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.text,
                },
                wordTextSelected: { color: colors.onPrimary, fontWeight: "700" },
                gap: {
                    paddingVertical: 6,
                    paddingHorizontal: 3,
                    borderRadius: 5,
                },
                gapDot: {
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.textSecondary,
                },
                cutBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    marginTop: 8,
                    paddingVertical: 8,
                    borderRadius: 9,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 10,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                cutBtnText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                actions: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 14 },
                actionBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                actionText: {
                    fontSize: fs(11.5),
                    lineHeight: lh(15),
                    fontWeight: "700",
                    color: colors.primary,
                },
                actionTextMuted: {
                    fontSize: fs(11.5),
                    lineHeight: lh(15),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                btnDisabled: { opacity: 0.4 },
                pressed: { opacity: 0.75 },
            }),
        [colors]
    );

export default ClipInspector;
