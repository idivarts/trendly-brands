/**
 * SceneInspector — everything about the selected scene.
 *
 * It is a PANEL on the selection rather than a modal, because every value in it
 * is something you change while watching the canvas: a duration, a transition,
 * a line of narration. A modal would cover the only thing that tells you
 * whether the change was right.
 *
 * ── The two refusals it has to explain ─────────────────────────────────────
 * Splitting an animation and narrating without provenance are both refused, and
 * a refusal with no reason reads as a bug. So both are stated here, in place,
 * with the alternative offered next to them.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import {
    IStudio,
    IStudioAudio,
    IStudioLayer,
    IStudioScene,
    NarrationSource,
    TransitionKind,
    effectiveSceneMs,
    isTimedFormat,
    narrationMs,
} from "@/shared-libs/firestore/trendly-pro/models/studio";
import LayerInspector from "@/components/studio/LayerInspector";
import SceneVideoPanel from "@/components/studio/SceneVideoPanel";
import SceneVoiceover from "@/components/studio/SceneVoiceover";
import StudioSoundPanel from "@/components/studio/StudioSoundPanel";
import { previewFidelity, slotLabel } from "@/shared-libs/design/studio-runtime";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const DURATIONS = [1000, 2000, 3000, 5000, 8000];
const TRANSITIONS: TransitionKind[] = [
    "cut",
    "dissolve",
    "dip",
    "slide",
    "wipe",
    "blur-dissolve",
    "whip",
];
const SOURCES: { value: NarrationSource; label: string; hint: string }[] = [
    { value: "script", label: "From the script", hint: "The words you wrote, or a trim of them." },
    { value: "caption", label: "From the caption", hint: "Taken from this post's caption." },
    { value: "brand", label: "A brand fact", hint: "Something documented in your brand profile." },
    { value: "paraphrase", label: "Reworded", hint: "Your material, reworded for the ear." },
    {
        value: "illustrative",
        label: "An illustration",
        hint: "An invented scenario. The scene will be marked as one on screen.",
    },
];

export interface SceneInspectorProps {
    brandId: string;
    studio: IStudio;
    scene: IStudioScene | null;
    media: Record<string, IAsset>;
    busy?: boolean;
    /** The whole timeline's length, for the sound panel's generated bed. */
    totalMs?: number;

    /** The layer whose controls to show, if one is selected on the canvas. */
    selectedLayerId?: string | null;
    onSelectLayer?: (layerId: string | null) => void;
    onChangeLayer?: (layerId: string, patch: Partial<IStudioLayer>) => void;
    onRemoveLayer?: (layerId: string) => void;
    onMoveLayer?: (layerId: string, delta: number) => void;

    onSetDuration: (ms: number) => void;
    onSetTransition: (kind: TransitionKind, durationMs: number) => void;
    onSetNarration: (line: string, source: NarrationSource, fit: boolean) => void;
    /** The generated voiceover landed; attach it to this scene. */
    onVoiceoverReady?: (mediaId: string, url: string, durationMs: number) => void;
    onDuplicate: () => void;
    onPickMedia: () => void;
    /** Document-level settings — the voice and the bed. */
    onPatchStudio?: (input: { audio: IStudioAudio }) => void;
    /**
     * Design this one scene again.
     *
     * The thing the old studio could not do at all: a scene was a node inside
     * one HTML document, so "regenerate scene 4" meant regenerating every
     * scene and losing the three the user was happy with.
     */
    onRegenerate?: (brief?: string) => void;
    regenerating?: boolean;
    /** The scene before this one, for chaining. */
    previousScene?: IStudioScene | null;
    /** The AI-video controls, when the format can hold video at all. */
    video?: React.ComponentProps<typeof SceneVideoPanel>["video"];
    onOpenCast?: () => void;
}

const SceneInspector: React.FC<SceneInspectorProps> = ({
    brandId,
    studio,
    scene,
    media,
    busy,
    totalMs,
    onSetDuration,
    onSetTransition,
    onSetNarration,
    onVoiceoverReady,
    onDuplicate,
    onPickMedia,
    onPatchStudio,
    onRegenerate,
    regenerating,
    previousScene,
    video,
    onOpenCast,
    selectedLayerId,
    onSelectLayer,
    onChangeLayer,
    onRemoveLayer,
    onMoveLayer,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const timed = isTimedFormat(studio.format);

    const [line, setLine] = useState(scene?.narration?.line ?? "");
    const [source, setSource] = useState<NarrationSource>(scene?.narration?.source ?? "paraphrase");
    const [fit, setFit] = useState(scene?.narration?.fitToNarration ?? true);
    const [regenBrief, setRegenBrief] = useState(scene?.gen?.prompt ?? "");

    // Reset the draft when the selection moves, or editing scene 2 silently
    // carries scene 1's line into it.
    const sceneId = scene?.id;
    const lastScene = React.useRef(sceneId);
    React.useEffect(() => {
        if (lastScene.current === sceneId) return;
        lastScene.current = sceneId;
        setLine(scene?.narration?.line ?? "");
        setSource(scene?.narration?.source ?? "paraphrase");
        setFit(scene?.narration?.fitToNarration ?? true);
        setRegenBrief(scene?.gen?.prompt ?? "");
    }, [sceneId, scene]);

    if (!scene) {
        return (
            <View style={styles.wrap}>
                <Text style={styles.empty}>Pick a scene to edit it.</Text>
            </View>
        );
    }

    const layerIndex = (scene.layers ?? []).findIndex((l) => l.id === selectedLayerId);
    const selectedLayer = layerIndex >= 0 ? scene.layers[layerIndex] : null;
    const splittable = scene.primaryKind !== "motion" && scene.primaryKind !== "composite";
    const spoken = narrationMs(line);
    const effective = effectiveSceneMs(scene);
    const overruns = spoken > 0 && !fit && spoken > effective * 1.15;

    return (
        <ScrollView style={styles.wrap} contentContainerStyle={styles.body}>
            <Section title="This scene" colors={colors}>
                <Text style={styles.meta}>
                    {kindLabel(scene.primaryKind)}
                    {timed ? ` · ${(effective / 1000).toFixed(1)}s on screen` : ""}
                </Text>
                {(scene.layers ?? []).map((l) => (
                    <Pressable
                        key={l.id}
                        style={[styles.layerRow, selectedLayerId === l.id && styles.layerRowOn]}
                        onPress={() => onSelectLayer?.(selectedLayerId === l.id ? null : l.id)}
                    >
                        <Text style={styles.layerName} numberOfLines={1}>
                            {l.kind === "html" ? "Design" : media[l.mediaId ?? ""]?.title || "Media"}
                        </Text>
                        <Text style={styles.layerSlot}>{slotLabel(l.slot)}</Text>
                    </Pressable>
                ))}
                <Pressable style={styles.primaryBtn} onPress={onPickMedia} disabled={busy}>
                    <Text style={styles.primaryBtnText}>
                        {scene.layers?.length ? "Add a layer" : "Put something in it"}
                    </Text>
                </Pressable>
            </Section>

            {selectedLayer && onChangeLayer ? (
                <Section title="This layer" colors={colors}>
                    <LayerInspector
                        layer={selectedLayer}
                        asset={selectedLayer.mediaId ? media[selectedLayer.mediaId] : undefined}
                        index={layerIndex}
                        total={scene.layers?.length ?? 0}
                        busy={busy}
                        onChange={(patch) => onChangeLayer(selectedLayer.id, patch)}
                        onRemove={() => onRemoveLayer?.(selectedLayer.id)}
                        onMove={(delta) => onMoveLayer?.(selectedLayer.id, delta)}
                    />
                </Section>
            ) : null}

            {timed ? (
                <Section title="Length" colors={colors}>
                    <View style={styles.chips}>
                        {DURATIONS.map((ms) => (
                            <Pressable
                                key={ms}
                                style={[styles.chip, scene.durationMs === ms && styles.chipOn]}
                                onPress={() => onSetDuration(ms)}
                                disabled={busy}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        scene.durationMs === ms && styles.chipTextOn,
                                    ]}
                                >
                                    {ms / 1000}s
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Section>
            ) : null}

            <Section title="How it arrives" colors={colors}>
                <View style={styles.chips}>
                    {TRANSITIONS.map((kind) => {
                        const on = (scene.transitionIn?.kind ?? "cut") === kind;
                        return (
                            <Pressable
                                key={kind}
                                style={[styles.chip, on && styles.chipOn]}
                                onPress={() => onSetTransition(kind, kind === "cut" ? 0 : 400)}
                                disabled={busy}
                            >
                                <Text style={[styles.chipText, on && styles.chipTextOn]}>{kind}</Text>
                            </Pressable>
                        );
                    })}
                </View>
                {scene.transitionIn && previewFidelity(scene.transitionIn.kind) !== "faithful" ? (
                    <Text style={styles.note}>
                        {/* Said rather than silently substituted: a preview
                            that faked this would have the user approve
                            something the export does not produce. */}
                        The preview shows this as a plain dissolve. The export does it properly.
                    </Text>
                ) : null}
                {scene.transitionIn && scene.transitionIn.kind !== "cut" ? (
                    <Text style={styles.note}>
                        A transition is an overlap, so this makes the timeline shorter, not longer.
                    </Text>
                ) : null}
            </Section>

            <Section title="What is said over it" colors={colors}>
                <TextInput
                    style={styles.input}
                    value={line}
                    onChangeText={setLine}
                    placeholder="The line spoken over this scene"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                />
                <Text style={styles.note}>
                    {spoken > 0 ? `About ${(spoken / 1000).toFixed(1)}s to say.` : "No narration."}
                </Text>

                <Text style={styles.subLabel}>Where it came from</Text>
                {SOURCES.map((s) => (
                    <Pressable
                        key={s.value}
                        style={[styles.sourceRow, source === s.value && styles.sourceRowOn]}
                        onPress={() => setSource(s.value)}
                        disabled={busy}
                    >
                        <Text style={[styles.sourceLabel, source === s.value && styles.chipTextOn]}>
                            {s.label}
                        </Text>
                        <Text style={styles.sourceHint}>{s.hint}</Text>
                    </Pressable>
                ))}
                {/* Provenance is required, not decorative. The brand's own
                    first rule is that a claim has to be one we can stand
                    behind, so an invented scenario has to say so. */}
                <Text style={styles.note}>
                    Every line has to say where it came from. An invented example is fine — it just
                    gets marked as one.
                </Text>

                <Pressable
                    style={[styles.toggle, fit && styles.toggleOn]}
                    onPress={() => setFit((v) => !v)}
                    disabled={busy}
                >
                    <Text style={[styles.chipText, fit && styles.chipTextOn]}>
                        {fit ? "Scene stretches to fit the line" : "Scene keeps its own length"}
                    </Text>
                </Pressable>
                {overruns ? (
                    <Text style={styles.warn}>
                        This line is longer than the scene. Either let the scene stretch, or shorten
                        the line — otherwise the voice runs over the next shot.
                    </Text>
                ) : null}

                <Pressable
                    style={styles.primaryBtn}
                    onPress={() => onSetNarration(line, source, fit)}
                    disabled={busy}
                >
                    <Text style={styles.primaryBtnText}>Save narration</Text>
                </Pressable>

                {/* Saved narration is what gets spoken, not the draft above —
                    generating from an unsaved line would record something the
                    scene does not actually say. */}
                {scene.narration?.line ? (
                    <SceneVoiceover
                        brandId={brandId}
                        voiceId={studio.audio?.voiceId}
                        narration={scene.narration}
                        busy={busy}
                        onGenerated={(mediaId, url, durationMs) =>
                            onVoiceoverReady?.(mediaId, url, durationMs)
                        }
                    />
                ) : null}
            </Section>

            {video && onOpenCast && isTimedFormat(studio.format) ? (
                <Section title="AI video" colors={colors}>
                    <SceneVideoPanel
                        studio={studio}
                        scene={scene}
                        previousScene={previousScene ?? null}
                        video={video}
                        busy={busy}
                        onOpenCast={onOpenCast}
                    />
                </Section>
            ) : null}

            {onRegenerate && (scene.primaryKind === "motion" || scene.primaryKind === "composite" || scene.gen) ? (
                <Section title="Design it again" colors={colors}>
                    <TextInput
                        style={styles.input}
                        value={regenBrief}
                        onChangeText={setRegenBrief}
                        placeholder="What should be on this scene?"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                    />
                    {scene.gen?.status === "failed" ? (
                        <Text style={styles.warn}>
                            {scene.gen.error || "The last attempt didn't come back."}
                        </Text>
                    ) : null}
                    <Pressable
                        style={[styles.primaryBtn, (busy || regenerating) && styles.btnOff]}
                        onPress={() => onRegenerate(regenBrief.trim() || undefined)}
                        disabled={busy || regenerating}
                    >
                        <Text style={styles.primaryBtnText}>
                            {regenerating ? "Designing…" : "Regenerate this scene"}
                        </Text>
                    </Pressable>
                    {/* Said plainly, because the alternative in the old studio
                        was regenerating everything and losing the scenes the
                        user was happy with. */}
                    <Text style={styles.note}>
                        Only this scene changes. The rest of the timeline is left alone.
                    </Text>
                </Section>
            ) : null}

            {onPatchStudio ? (
                <Section title="Sound" colors={colors}>
                    <StudioSoundPanel
                        brandId={brandId}
                        studio={studio}
                        busy={busy}
                        totalMs={totalMs}
                        onPatch={onPatchStudio}
                    />
                </Section>
            ) : null}

            {!splittable ? (
                <Section title="Splitting" colors={colors}>
                    <Text style={styles.note}>
                        This scene is an animation, so splitting it would leave the second half
                        starting mid-movement.
                    </Text>
                    <Pressable style={styles.secondaryBtn} onPress={onDuplicate} disabled={busy}>
                        <Text style={styles.secondaryBtnText}>Duplicate and shorten both</Text>
                    </Pressable>
                </Section>
            ) : null}
        </ScrollView>
    );
};

const Section: React.FC<{
    title: string;
    colors: ReturnType<typeof Colors>;
    children: React.ReactNode;
}> = ({ title, colors, children }) => (
    <View style={inspectorStatics.section}>
        <Text style={[inspectorStatics.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
        {children}
    </View>
);

function kindLabel(kind: IStudioScene["primaryKind"]): string {
    switch (kind) {
        case "motion":
            return "Motion graphics";
        case "composite":
            return "Composed still";
        case "video":
            return "Video";
        case "image":
            return "Image";
        default:
            return "Empty";
    }
}

const inspectorStatics = StyleSheet.create({
    section: { gap: 8 },
    sectionTitle: {
        fontSize: fs(11),
        lineHeight: lh(15),
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
});

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                wrap: { flex: 1, backgroundColor: colors.background },
                body: { padding: 16, gap: 22 },
                empty: {
                    padding: 20,
                    color: colors.textSecondary,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                },
                meta: { color: colors.text, fontSize: fs(13), lineHeight: lh(19) },
                layerRow: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 8,
                    backgroundColor: colors.tag,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                },
                layerName: { flex: 1, color: colors.text, fontSize: fs(12), lineHeight: lh(17) },
                layerSlot: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(15) },
                chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
                chip: {
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                chipOn: { backgroundColor: colors.primary },
                chipText: { color: colors.text, fontSize: fs(12), lineHeight: lh(16) },
                chipTextOn: { color: colors.white, fontWeight: "600" },
                note: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(16) },
                warn: { color: colors.red, fontSize: fs(11), lineHeight: lh(16) },
                subLabel: {
                    marginTop: 4,
                    color: colors.text,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    padding: 11,
                    minHeight: fbox(66),
                    color: colors.text,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    textAlignVertical: "top",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                sourceRow: {
                    backgroundColor: colors.tag,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    gap: 2,
                },
                layerRowOn: { backgroundColor: withAlpha(colors.primary, 0.16) },
                sourceRowOn: { backgroundColor: withAlpha(colors.primary, 0.16) },
                sourceLabel: { color: colors.text, fontSize: fs(12), lineHeight: lh(17), fontWeight: "600" },
                sourceHint: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(15) },
                toggle: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 11,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                toggleOn: { backgroundColor: withAlpha(colors.primary, 0.18) },
                primaryBtn: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryBtnText: {
                    color: colors.white,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
                secondaryBtn: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                },
                secondaryBtnText: { color: colors.text, fontSize: fs(12), lineHeight: lh(17), fontWeight: "600" },
                btnOff: { opacity: 0.45 },
            }),
        [colors]
    );

export default SceneInspector;
