/**
 * SceneVideoPanel — generate this scene as AI video.
 *
 * ── Why the controls come from the registry ─────────────────────────────────
 * Every length, resolution and keyframe option here is read off the chosen
 * model's row. A control that offers something the model ignores costs real
 * money: the user pays for the generation either way, and a clip that quietly
 * dropped the start frame they pinned looks like the feature not working. Veo
 * takes 4, 6 or 8 seconds and refuses 5 — so 5 is not offered.
 *
 * ── Why the price is above the button ──────────────────────────────────────
 * Generated video is an order of magnitude dearer than anything else in this
 * product, and the cost depends on the length the user picks. A gate that only
 * refuses is half a gate; the other half is saying the price while they can
 * still change their mind.
 *
 * ── The two refusals that are fixable in place ─────────────────────────────
 * `anchor_required` and `incompatible_capabilities` are not errors, they are
 * decisions. Both are shown here with the fix beside them rather than as a
 * failure message, because sending someone to a billing page for either would
 * be wrong.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { TokenMeterBlock, TokenMeterNotice } from "@/components/billing/TokenMeter";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useMediaModels } from "@/hooks/use-media-models";
import { acceptedDurations, useSceneVideo } from "@/hooks/use-scene-video";
import { ICastMember, IStudio, IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { goToBilling } from "@/utils/billing-navigation";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export interface SceneVideoPanelProps {
    studio: IStudio;
    scene: IStudioScene;
    /** The scene before this one, for chaining. Null for the first. */
    previousScene: IStudioScene | null;
    video: ReturnType<typeof useSceneVideo>;
    busy?: boolean;
    onOpenCast: () => void;
}

const SceneVideoPanel: React.FC<SceneVideoPanelProps> = ({
    studio,
    scene,
    previousScene,
    video,
    busy,
    onOpenCast,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { tokens } = useEntitlements();
    const { models, loading } = useMediaModels("video");

    const [modelId, setModelId] = useState<string>("");
    const [prompt, setPrompt] = useState(scene.gen?.prompt ?? "");
    const [durationSecs, setDurationSecs] = useState(0);
    const [castIds, setCastIds] = useState<string[]>(scene.gen?.castIds ?? []);
    const [chain, setChain] = useState(false);

    // The registry is sorted cheapest first, and a generation is charged on
    // acceptance — so the preselection must never be the dearest model.
    const model = useMemo(
        () => models.find((m) => m.id === modelId) ?? models[0],
        [models, modelId]
    );
    const durations = useMemo(() => acceptedDurations(model), [model]);

    useEffect(() => {
        if (!model) return;
        if (!modelId) setModelId(model.id);
        if (!durationSecs || !durations.includes(durationSecs)) {
            setDurationSecs(durations[0]);
        }
    }, [model, modelId, durations, durationSecs]);

    useEffect(() => {
        if (model?.id && durationSecs) void video.getQuote(model.id, durationSecs);
    }, [model?.id, durationSecs]);

    // A chain and a face anchor cannot both apply: the provider refuses a
    // keyframe alongside a reference image. Said here, before the request, so
    // the two controls visibly exclude each other.
    const chainPossible =
        !!previousScene && !!model?.startFrame && castIds.length === 0;
    const anchorsInUse = castIds.length > 0;

    if (tokens.state === "exhausted") {
        return (
            <View style={styles.wrap}>
                <TokenMeterBlock tokens={tokens} />
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.wrap}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (models.length === 0) {
        // An empty registry is the NORMAL state for a workspace where nothing
        // has been enabled — `enabled: false` means "not available to you". It
        // must not read as an error.
        return (
            <View style={styles.wrap}>
                <Text style={styles.note}>
                    AI video isn't switched on for your workspace yet.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            {tokens.state === "low" || tokens.state === "critical" ? (
                <TokenMeterNotice tokens={tokens} />
            ) : null}

            <TextInput
                style={styles.input}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="What happens in this shot?"
                placeholderTextColor={colors.textSecondary}
                multiline
            />

            <Text style={styles.label}>Model</Text>
            <View style={styles.chips}>
                {models.map((m) => {
                    const on = model?.id === m.id;
                    return (
                        <Pressable
                            key={m.id}
                            style={[styles.chip, on && styles.chipOn]}
                            onPress={() => setModelId(m.id)}
                            disabled={busy}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                {m.displayName}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Text style={styles.label}>Length</Text>
            <View style={styles.chips}>
                {durations.map((s) => {
                    const on = durationSecs === s;
                    return (
                        <Pressable
                            key={s}
                            style={[styles.chip, on && styles.chipOn]}
                            onPress={() => setDurationSecs(s)}
                            disabled={busy}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{s}s</Text>
                        </Pressable>
                    );
                })}
            </View>
            {model?.durationsS?.length ? (
                <Text style={styles.note}>
                    This model only makes clips of {model.durationsS.join(", ")} seconds. A longer
                    shot is two scenes.
                </Text>
            ) : null}

            {studio.cast?.length ? (
                <>
                    <Text style={styles.label}>Who is in it</Text>
                    <View style={styles.chips}>
                        {studio.cast.map((m: ICastMember) => {
                            const on = castIds.includes(m.id);
                            return (
                                <Pressable
                                    key={m.id}
                                    style={[styles.chip, on && styles.chipOn]}
                                    onPress={() =>
                                        setCastIds((ids) =>
                                            on ? ids.filter((i) => i !== m.id) : [...ids, m.id]
                                        )
                                    }
                                    disabled={busy}
                                >
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                        {m.description}
                                        {m.anchorMediaId ? " ·" : ""}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <Text style={styles.note}>
                        A dot means they have an approved still. Above two clips, that still is what
                        keeps the same face.
                    </Text>
                </>
            ) : (
                <Pressable style={styles.secondary} onPress={onOpenCast} disabled={busy}>
                    <Text style={styles.secondaryText}>Add someone to the cast</Text>
                </Pressable>
            )}

            {previousScene ? (
                <>
                    <Text style={styles.label}>Continue the previous shot</Text>
                    <Pressable
                        style={[
                            styles.toggle,
                            chain && styles.toggleOn,
                            !chainPossible && styles.off,
                        ]}
                        onPress={() => setChain((v) => !v)}
                        disabled={busy || !chainPossible}
                    >
                        <Text style={[styles.chipText, chain && styles.chipTextOn]}>
                            {chain ? "Carries on from the last frame" : "A new shot"}
                        </Text>
                    </Pressable>
                    {anchorsInUse ? (
                        <Text style={styles.note}>
                            Not available with a cast member selected — a clip can continue from a
                            frame or reference a face, not both.
                        </Text>
                    ) : !model?.startFrame ? (
                        <Text style={styles.note}>
                            This model can't start from an image, so it can't continue a shot.
                        </Text>
                    ) : (
                        <Text style={styles.note}>
                            Only for one unbroken movement carrying on. For the same person in a
                            different moment, use the cast instead.
                        </Text>
                    )}
                </>
            ) : null}

            {video.refusal ? <Refusal colors={colors} refusal={video.refusal} onOpenCast={onOpenCast} /> : null}

            {video.quote ? (
                <Text style={styles.price}>
                    About {video.quote.tokens.toLocaleString()} tokens for {video.quote.durationSecs}s
                    {video.quote.provisional ? " · estimated" : ""}
                </Text>
            ) : video.quoting ? (
                <Text style={styles.note}>Pricing…</Text>
            ) : null}

            <Pressable
                style={[
                    styles.primary,
                    (!prompt.trim() || video.generating || busy) && styles.off,
                ]}
                onPress={async () => {
                    if (!model) return;
                    let startFrameMediaId: string | undefined;
                    if (chain && previousScene) {
                        // Extraction is a worker job, so this only starts it.
                        // The frame arrives in the library and the user
                        // generates again with it — explained in the panel
                        // rather than silently waiting.
                        await video.prepareChain(scene.id, previousScene.id);
                        return;
                    }
                    await video.generate({
                        sceneId: scene.id,
                        modelId: model.id,
                        prompt: prompt.trim(),
                        durationSecs,
                        castIds,
                        startFrameMediaId,
                        chainedFromSceneId: chain ? previousScene?.id : undefined,
                    });
                }}
                disabled={!prompt.trim() || video.generating || busy}
            >
                {video.generating || video.chaining ? (
                    <ActivityIndicator color={colors.white} size="small" />
                ) : (
                    <Text style={styles.primaryText}>
                        {chain ? "Take the last frame first" : "Generate this clip"}
                    </Text>
                )}
            </Pressable>

            {scene.pending ? (
                <Text style={styles.note}>
                    A clip is being made for this scene. It appears here when it's done — minutes,
                    not seconds.
                </Text>
            ) : null}
        </View>
    );
};

const Refusal: React.FC<{
    colors: ReturnType<typeof Colors>;
    refusal: NonNullable<ReturnType<typeof useSceneVideo>["refusal"]>;
    onOpenCast: () => void;
}> = ({ colors, refusal, onOpenCast }) => {
    const styles = useStyles(colors);
    const money = refusal.reason === "tokens_exhausted" || refusal.reason === "plan_locked";
    return (
        <View style={styles.refusal}>
            <Text style={styles.refusalText}>{refusal.message}</Text>
            {refusal.reason === "anchor_required" ? (
                <Pressable style={styles.secondary} onPress={onOpenCast}>
                    <Text style={styles.secondaryText}>Pick their anchor</Text>
                </Pressable>
            ) : null}
            {money ? (
                <Pressable
                    style={styles.secondary}
                    onPress={() =>
                        goToBilling("ai_generate_blocked", { reason: refusal.reason })
                    }
                >
                    <Text style={styles.secondaryText}>
                        {refusal.reason === "plan_locked" ? "See the plans" : "Top up"}
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                wrap: { gap: 8 },
                label: {
                    marginTop: 2,
                    color: colors.textSecondary,
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
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
                },
                chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
                chip: {
                    paddingHorizontal: 11,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                chipOn: { backgroundColor: colors.primary },
                chipText: { color: colors.text, fontSize: fs(11), lineHeight: lh(15) },
                chipTextOn: { color: colors.white, fontWeight: "600" },
                toggle: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 11,
                    paddingVertical: 9,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                toggleOn: { backgroundColor: withAlpha(colors.primary, 0.18) },
                off: { opacity: 0.45 },
                note: { color: colors.textSecondary, fontSize: fs(10), lineHeight: lh(15) },
                price: {
                    color: colors.text,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
                refusal: {
                    gap: 8,
                    backgroundColor: withAlpha(colors.red, 0.08),
                    borderRadius: 10,
                    padding: 11,
                },
                refusalText: { color: colors.text, fontSize: fs(11), lineHeight: lh(16) },
                primary: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderRadius: 10,
                    minHeight: 44,
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryText: { color: colors.white, fontSize: fs(12), lineHeight: lh(17), fontWeight: "600" },
                secondary: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 13,
                    paddingVertical: 10,
                    borderRadius: 10,
                    minHeight: 44,
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                secondaryText: { color: colors.text, fontSize: fs(11), lineHeight: lh(16), fontWeight: "600" },
            }),
        [colors]
    );

export default SceneVideoPanel;
