/**
 * SceneRail — the scenes, in order, as the thing you edit the timeline with.
 *
 * ── Why the rail is the editor ──────────────────────────────────────────────
 * Every structural edit lives here: reorder, delete, duplicate, insert a gap in
 * the middle. That is possible only because a scene is a DOCUMENT now. In the
 * old studio a scene was a `[data-slide]` node inside one HTML file, so
 * "reorder" meant rewriting the document and "regenerate scene 4" meant
 * regenerating everything.
 *
 * ── Drawn to scale, and why ─────────────────────────────────────────────────
 * A timed format's cards are proportional to their EFFECTIVE length — after
 * narration stretches a scene and after transitions take their overlap. The
 * questions people actually have are proportional ones: is the opening too
 * long, does the hook land before the second beat. A list of equal cards with
 * durations typed on them answers none of them.
 *
 * A carousel has no clock, so its cards are equal and the transport is arrows.
 * That difference is read from the format, never from whether durations happen
 * to be set.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import {
    IStudio,
    IStudioScene,
    effectiveSceneMs,
    isTimedFormat,
} from "@/shared-libs/firestore/trendly-pro/models/studio";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import { previewFidelity } from "@/shared-libs/design/studio-runtime";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faArrowLeft,
    faArrowRight,
    faClone,
    faCode,
    faFilm,
    faImage,
    faPlus,
    faScissors,
    faTrash,
    faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

/** Narrowest a card may get, so a 300ms scene is still tappable. */
const MIN_CARD_WIDTH = 56;
/** Widest, so one 20-second scene does not push everything else off screen. */
const MAX_CARD_WIDTH = 190;
/** Pixels per second for a timed rail. */
const PX_PER_SECOND = 28;

export interface SceneRailProps {
    studio: IStudio;
    scenes: IStudioScene[];
    media: Record<string, IAsset>;
    selectedSceneId: string | null;

    onSelect: (sceneId: string) => void;
    onAdd: () => void;
    onInsertAt: (index: number) => void;
    onDelete: (sceneId: string) => void;
    onDuplicate: (sceneId: string) => void;
    onSplit: (sceneId: string) => void;
    onMove: (sceneId: string, toIndex: number) => void;
    /** Offer the director. An OFFER beside "Add scene", never a gate. */
    onAskAI?: () => void;
    busy?: boolean;
}

const SceneRail: React.FC<SceneRailProps> = ({
    studio,
    scenes,
    media,
    selectedSceneId,
    onSelect,
    onAdd,
    onInsertAt,
    onDelete,
    onDuplicate,
    onSplit,
    onMove,
    onAskAI,
    busy,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const timed = isTimedFormat(studio.format);

    return (
        <View style={styles.wrap}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.strip}
            >
                {/* A gap BEFORE the first scene. The requirement is "insert an
                    empty scene in the middle", and the first position is the
                    one people reach for most — a new opening shot. */}
                <InsertGap colors={colors} onPress={() => onInsertAt(0)} />

                {scenes.map((scene, index) => (
                    <React.Fragment key={scene.id}>
                        {/* A run's scenes read as ONE batch. Six scenes the AI
                            planned used to be indistinguishable from six the
                            user added one at a time, which made "regenerate
                            the run" and "this one is mine" impossible to tell
                            apart on the only screen that shows them. The band
                            is drawn at the START of each run only, so it reads
                            as a bracket rather than a label repeated six
                            times. */}
                        {runStartsHere(scenes, index) ? (
                            <RunBand colors={colors} count={runLength(scenes, index)} />
                        ) : null}
                        <SceneCard
                            scene={scene}
                            index={index}
                            total={scenes.length}
                            timed={timed}
                            asset={firstAssetOf(scene, media)}
                            selected={selectedSceneId === scene.id}
                            colors={colors}
                            busy={busy}
                            onSelect={() => onSelect(scene.id)}
                            onDelete={() => onDelete(scene.id)}
                            onDuplicate={() => onDuplicate(scene.id)}
                            onSplit={() => onSplit(scene.id)}
                            onMoveLeft={() => onMove(scene.id, index - 1)}
                            onMoveRight={() => onMove(scene.id, index + 1)}
                        />
                        <InsertGap colors={colors} onPress={() => onInsertAt(index + 1)} />
                    </React.Fragment>
                ))}

                <Pressable style={styles.addCard} onPress={onAdd} disabled={busy}>
                    <FontAwesomeIcon icon={faPlus} size={16} color={colors.primary} />
                    <Text style={styles.addText}>Add scene</Text>
                </Pressable>

                {onAskAI ? (
                    <Pressable style={styles.aiCard} onPress={onAskAI} disabled={busy}>
                        <FontAwesomeIcon icon={faWandMagicSparkles} size={16} color={colors.primary} />
                        {/* Beside "Add scene", not in front of it. The studio
                            opens blank and the director is an offer: a user who
                            knows what they want should never have to decline
                            help to get a canvas. */}
                        <Text style={styles.addText}>Let AI plan it</Text>
                    </Pressable>
                ) : null}
            </ScrollView>
        </View>
    );
};

/**
 * Whether a new run begins at this index.
 *
 * Consecutive-only on purpose. `runId` groups scenes, but the rail's order is
 * the user's and they may have dragged a hand-made scene into the middle of a
 * batch — which SPLITS it, visually and truthfully. Drawing one bracket around
 * scenes 1-3 and 5-6 is honest about what they would get if they regenerated
 * the run; drawing one bracket from 1 to 6 would claim scene 4 belonged to it.
 */
function runStartsHere(scenes: IStudioScene[], index: number): boolean {
    const id = scenes[index]?.runId;
    if (!id) return false;
    return scenes[index - 1]?.runId !== id;
}

/** How many consecutive scenes from this index share the run. */
function runLength(scenes: IStudioScene[], index: number): number {
    const id = scenes[index]?.runId;
    if (!id) return 0;
    let n = 0;
    while (index + n < scenes.length && scenes[index + n].runId === id) n++;
    return n;
}

/**
 * The bracket that opens a run on the rail.
 *
 * A thin vertical accent plus a count, not a border around the group: the rail
 * scrolls horizontally and a box would have to be measured against cards whose
 * widths are proportional to their durations. The accent is a sibling View, per
 * the project's no-borders rule.
 */
const RunBand: React.FC<{
    colors: ReturnType<typeof Colors>;
    count: number;
}> = ({ colors, count }) => (
    <View style={railStatics.runBand}>
        <View style={[railStatics.runStripe, { backgroundColor: withAlpha(colors.primary, 0.55) }]} />
        <Text style={[railStatics.runLabel, { color: colors.text }]} numberOfLines={1}>
            AI batch
        </Text>
        <Text style={[railStatics.runCount, { color: colors.textSecondary }]}>{count}</Text>
    </View>
);

const InsertGap: React.FC<{ colors: ReturnType<typeof Colors>; onPress: () => void }> = ({
    colors,
    onPress,
}) => (
    <Pressable style={railStatics.gap} onPress={onPress} hitSlop={6}>
        <View style={[railStatics.gapLine, { backgroundColor: withAlpha(colors.primary, 0.25) }]} />
        <View style={[railStatics.gapDot, { backgroundColor: colors.primary }]}>
            <FontAwesomeIcon icon={faPlus} size={9} color={colors.white} />
        </View>
    </Pressable>
);

interface SceneCardProps {
    scene: IStudioScene;
    index: number;
    total: number;
    timed: boolean;
    asset?: IAsset;
    selected: boolean;
    colors: ReturnType<typeof Colors>;
    busy?: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onSplit: () => void;
    onMoveLeft: () => void;
    onMoveRight: () => void;
}

const SceneCard: React.FC<SceneCardProps> = ({
    scene,
    index,
    total,
    timed,
    asset,
    selected,
    colors,
    busy,
    onSelect,
    onDelete,
    onDuplicate,
    onSplit,
    onMoveLeft,
    onMoveRight,
}) => {
    const ms = effectiveSceneMs(scene);
    const width = timed
        ? Math.max(MIN_CARD_WIDTH, Math.min(MAX_CARD_WIDTH, (ms / 1000) * PX_PER_SECOND))
        : 104;

    // Splitting an animation leaves the second half starting mid-movement, so
    // it is not offered. The inspector explains and offers duplicate instead.
    const splittable = scene.primaryKind !== "motion" && scene.primaryKind !== "composite";

    const transition = scene.transitionIn;
    const fidelity = transition ? previewFidelity(transition.kind) : "faithful";

    return (
        <Pressable
            style={[
                railStatics.card,
                { width, backgroundColor: colors.tag },
                selected && {
                    backgroundColor: withAlpha(colors.primary, 0.12),
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 10,
                    shadowOpacity: 0.4,
                    elevation: 4,
                },
            ]}
            onPress={onSelect}
        >
            <View style={railStatics.thumb}>
                {asset?.thumbUrl || asset?.url ? (
                    <Image
                        source={{ uri: asset.thumbUrl || asset.url }}
                        resizeMode="cover"
                        style={railStatics.thumbImage}
                    />
                ) : (
                    <View
                        style={[
                            railStatics.thumbImage,
                            railStatics.thumbEmpty,
                            { backgroundColor: withAlpha(colors.text, 0.06) },
                        ]}
                    >
                        <FontAwesomeIcon
                            icon={kindIcon(scene.primaryKind)}
                            size={13}
                            color={colors.textSecondary}
                        />
                    </View>
                )}
                {scene.pending ? (
                    <View style={[railStatics.pendingPill, { backgroundColor: withAlpha(colors.primary, 0.9) }]}>
                        <Text style={[railStatics.pendingText, { color: colors.white }]}>Making…</Text>
                    </View>
                ) : null}
            </View>

            <View style={railStatics.meta}>
                <Text style={[railStatics.position, { color: colors.textSecondary }]} numberOfLines={1}>
                    {index + 1}
                    {timed ? ` · ${(ms / 1000).toFixed(1)}s` : ""}
                </Text>
                {transition && transition.kind !== "cut" ? (
                    <Text
                        style={[railStatics.position, { color: colors.textSecondary }]}
                        numberOfLines={1}
                    >
                        {/* A placeholder preview is SAID so nobody approves
                            something the export will not produce. */}
                        {transition.kind}
                        {fidelity === "placeholder" ? " ~" : ""}
                    </Text>
                ) : null}
            </View>

            {selected ? (
                <View style={railStatics.actions}>
                    <RailAction icon={faArrowLeft} disabled={index === 0 || busy} onPress={onMoveLeft} colors={colors} />
                    <RailAction
                        icon={faArrowRight}
                        disabled={index === total - 1 || busy}
                        onPress={onMoveRight}
                        colors={colors}
                    />
                    <RailAction icon={faClone} disabled={busy} onPress={onDuplicate} colors={colors} />
                    <RailAction icon={faScissors} disabled={!splittable || busy} onPress={onSplit} colors={colors} />
                    <RailAction icon={faTrash} disabled={busy} onPress={onDelete} colors={colors} danger />
                </View>
            ) : null}
        </Pressable>
    );
};

const RailAction: React.FC<{
    icon: IconDefinition;
    onPress: () => void;
    colors: ReturnType<typeof Colors>;
    disabled?: boolean;
    danger?: boolean;
}> = ({ icon, onPress, colors, disabled, danger }) => (
    <Pressable
        style={[railStatics.action, { backgroundColor: withAlpha(colors.text, 0.06) }, disabled && railStatics.actionOff]}
        onPress={onPress}
        disabled={disabled}
        hitSlop={4}
    >
        <FontAwesomeIcon icon={icon} size={10} color={danger ? colors.red : colors.text} />
    </Pressable>
);

function kindIcon(kind: IStudioScene["primaryKind"]): IconDefinition {
    switch (kind) {
        case "video":
            return faFilm;
        case "image":
            return faImage;
        case "motion":
        case "composite":
            return faCode;
        default:
            return faPlus;
    }
}

function firstAssetOf(
    scene: IStudioScene,
    media: Record<string, IAsset>
): IAsset | undefined {
    for (const l of scene.layers ?? []) {
        if (l.mediaId && media[l.mediaId]) return media[l.mediaId];
    }
    return undefined;
}

const railStatics = StyleSheet.create({
    // The run bracket. A stripe View rather than a border, per the project's
    // no-borders rule, and narrow so it costs the rail almost no width.
    runBand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 4,
        alignSelf: "stretch",
    },
    runStripe: { width: 3, alignSelf: "stretch", borderRadius: 2, minHeight: fbox(40) },
    runLabel: { fontSize: fs(9), lineHeight: lh(12), fontWeight: "700" },
    runCount: { fontSize: fs(9), lineHeight: lh(12), fontWeight: "600" },
    card: {
        borderRadius: 10,
        padding: 6,
        gap: 5,
        overflow: "hidden",
    },
    thumb: { height: fbox(52), borderRadius: 6, overflow: "hidden" },
    thumbImage: { width: "100%", height: "100%" },
    thumbEmpty: { alignItems: "center", justifyContent: "center" },
    pendingPill: {
        position: "absolute",
        left: 4,
        bottom: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pendingText: { fontSize: fs(9), lineHeight: lh(12), fontWeight: "600" },
    meta: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
    position: { fontSize: fs(10), lineHeight: lh(14) },
    actions: { flexDirection: "row", gap: 3, justifyContent: "center" },
    action: {
        width: fbox(20),
        height: fbox(20),
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    actionOff: { opacity: 0.3 },
    gap: { width: 18, alignItems: "center", justifyContent: "center" },
    gapLine: { position: "absolute", width: 2, top: 10, bottom: 10, borderRadius: 1 },
    gapDot: {
        width: fbox(16),
        height: fbox(16),
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
});

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    backgroundColor: colors.background,
                    paddingVertical: 10,
                    // An upward shadow, so the rail reads as a floating bar
                    // over the canvas rather than a bordered panel.
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 4,
                },
                strip: { paddingHorizontal: 12, alignItems: "center", gap: 0 },
                addCard: {
                    marginLeft: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: withAlpha(colors.primary, 0.1),
                },
                aiCard: {
                    marginLeft: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: colors.tag,
                },
                addText: {
                    color: colors.primary,
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "600",
                },
            }),
        [colors]
    );

export default SceneRail;
