/**
 * Composer — one surface for describing the media you want.
 *
 * Approach tabs, a reference tray, one prompt box, a settings strip and send.
 * It replaces the separate "open the studio, then type into an empty canvas"
 * step: the brief now lives in the media section of the content page, so the
 * caption and the hashtags stay on screen while you describe the media that
 * goes with them.
 *
 * ⭐ The rule this component exists to enforce: switching approach keeps the
 * prompt and everything attached. Only the settings reset, and refs the new
 * approach does not render stay in state rather than being dropped — so tabbing
 * away and back brings them straight back. Changing your mind about the
 * approach has to be free, or the tabs are just a wizard with extra steps.
 */
import { ContentType } from "@/components/content-calendar/types";
import { fs, lh } from "@/constants/Typography";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { track } from "@/shared-libs/utils/analytics";
import { faArrowUp, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import ComingSoonPanel from "./ComingSoonPanel";
import ReferenceTray, { ComposerRefs } from "./ReferenceTray";
import SettingSheet from "./SettingSheet";
import SettingsStrip from "./SettingsStrip";
import {
    APPROACHES,
    ApproachId,
    ApproachSpec,
    ComingSoon,
    SettingKey,
    approachesFor,
    defaultApproachFor,
    defaultSettings,
    settingsFor,
} from "./approach-spec";
import { IMediaModel } from "@/shared-libs/firestore/trendly-pro/models/media-model";
import { durationOptionsFor } from "@/hooks/media-model-options";
import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import { useAIModels } from "@/hooks/use-ai-models";
import { AIModel, AIPlan, planAllows } from "@/contexts/ai-config-context.provider";

/**
 * A registry row, as the shared model picker sees it.
 *
 * The SAME picker renders both kinds on purpose. A video model and a design
 * model are the same decision to the person making it — "which thing does
 * this" — so a second control, with its own look in its own corner, would
 * teach that they are different things. One control, one place, every
 * approach.
 *
 * `unlocked` is computed rather than assumed, so a model above the org's plan
 * shows as locked and routes to billing from here, instead of being offered,
 * accepted, and refused by the backend with a 402.
 */
function asPickerModel(m: IMediaModel, plan: AIPlan): AIModel {
    return {
        id: m.id,
        displayName: m.displayName,
        provider: m.provider,
        minPlan: (m.minPlan || "free") as AIPlan,
        unlocked: planAllows(plan, m.minPlan),
    };
}

/** Everything the composer collected, handed to whoever runs the generation. */
export interface ComposerBrief {
    approach: ApproachId;
    prompt: string;
    refs: ComposerRefs;
    settings: Partial<Record<SettingKey, string>>;
    /**
     * The chosen video model, for the AI-video approach only.
     *
     * Carried on the brief rather than looked up later because the generation
     * is charged the moment it is accepted: whoever submits has to send the
     * model the user was actually looking at when they pressed send, not
     * whatever the registry happens to list first by then.
     */
    modelId?: string;
    /**
     * Instructions ABOUT the brief, added by whoever submits it rather than
     * typed by the user — "the footage is asset X, read it with get_footage
     * first". Kept separate from `prompt` so the user's own words are never
     * rewritten, and so a reader of the thread can tell which is which.
     */
    notes?: string[];
}

/**
 * Shown in place of the composer when the AI-video approach has no model to
 * run on.
 *
 * `enabled` in the model registry is a REVIEW GATE — the catalog sync inserts
 * new models disabled and never flips it — so an empty list is an ordinary
 * state for a workspace, not a fault. It reuses the coming-soon panel because
 * the situation is the same from where the user sits, and the interest signal
 * it collects is just as useful.
 */
const NO_VIDEO_MODEL: ComingSoon = {
    promo: "Generated video isn't switched on for your workspace yet.",
    supporting:
        "Tell us you want it and we'll turn it on — the clip drops straight onto the same timeline as your motion graphics.",
};

interface Props {
    contentType: ContentType;
    onSubmit: (brief: ComposerBrief) => void;
    /** Enabled video models, for the AI-video approach. Empty is a real state. */
    videoModels?: IMediaModel[];
    /**
     * Enabled speech-to-text models, for the footage approach: the thing that
     * READS an upload before the AI can cut it. Shown rather than hidden
     * because "the AI reads your footage" is the entire promise of that tab,
     * and which model does the reading is the first question it raises.
     */
    sttModels?: IMediaModel[];
    disabled?: boolean;
}

const hasAnyRef = (refs: ComposerRefs): boolean =>
    !!(
        refs.attachments?.length ||
        refs.reference ||
        refs.startFrame ||
        refs.endFrame ||
        refs.sourceVideo
    );

const Composer: React.FC<Props> = ({
    contentType,
    onSubmit,
    videoModels = [],
    sttModels = [],
    disabled,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);

    // The model that writes the design. Shared selection with the chat and the
    // Studio's own brief box, so a choice made in any of them shows in all —
    // this was the only prompt box in the app without the picker, which read
    // as the chat beside it being the real input.
    const {
        models: designModels,
        selectedModel: designModel,
        setSelectedModel,
        plan,
    } = useAIModels("design");

    const approaches = useMemo(() => approachesFor(contentType), [contentType]);
    const [approachId, setApproachId] = useState<ApproachId | null>(() =>
        defaultApproachFor(contentType)
    );

    // `contentType` is derived from a document that loads asynchronously, so it
    // can start as the route's fallback ("post") and become the real type a
    // moment later. Without this the composer would hold an image approach
    // while showing the video tabs: no tab reads as selected, and the body
    // below belongs to a different kind of media entirely.
    const valid = approaches.some((a) => a.id === approachId);
    useEffect(() => {
        if (!valid) setApproachId(defaultApproachFor(contentType));
    }, [valid, contentType]);

    const approach: ApproachSpec | null =
        approachId && valid ? APPROACHES[approachId] : null;

    // Prompt and refs are owned here and NEVER reset on an approach change.
    const [prompt, setPrompt] = useState("");
    const [refs, setRefs] = useState<ComposerRefs>({});
    const [settings, setSettings] = useState<Partial<Record<SettingKey, string>>>(() => {
        const first = defaultApproachFor(contentType);
        return first ? defaultSettings(APPROACHES[first], contentType) : {};
    });
    const [openSetting, setOpenSetting] = useState<SettingKey | null>(null);
    // Compared against the live settings to report whether anything was touched.
    const [defaults, setDefaults] = useState(settings);

    const switchApproach = useCallback(
        (next: ApproachId) => {
            if (next === approachId) return;
            const spec = APPROACHES[next];
            const nextDefaults = defaultSettings(spec, contentType);
            setApproachId(next);
            setSettings(nextDefaults);
            setDefaults(nextDefaults);
            track("content_approach_picked", { approach: next });
        },
        [approachId, contentType]
    );

    const visibleSettings = useMemo(
        () => (approach ? settingsFor(approach, contentType) : []),
        [approach, contentType]
    );

    // ── The video model ──────────────────────────────────────────────────────
    // Only the AI-video approach has one. The first entry is the cheapest (the
    // hook sorts them), which is the right default for something charged on
    // acceptance.
    const [modelId, setModelId] = useState<string | null>(null);
    const model = useMemo(
        () => videoModels.find((m) => m.id === modelId) ?? videoModels[0],
        [videoModels, modelId]
    );
    const needsModel = approach?.id === "genvideo";

    // The length chips for AI video are the MODEL's bounds, not the table's
    // list. A model capped at 8s refuses a 30s request, so offering 30 would be
    // offering a value that is always rejected.
    const lengthOptions = useMemo(
        () =>
            needsModel && model
                ? durationOptionsFor(model).map((v) => ({ value: v, name: v }))
                : undefined,
        [needsModel, model]
    );

    // Keep the chosen length inside what this model can make — switching from a
    // model that goes to 30s to one that caps at 8 must not leave 30s showing.
    useEffect(() => {
        if (!needsModel || !lengthOptions?.length) return;
        if (!lengthOptions.some((o) => o.value === settings.length)) {
            setSettings((cur) => ({ ...cur, length: lengthOptions[0].value }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsModel, lengthOptions?.map((o) => o.value).join(",")]);

    /**
     * The models the picker offers, and which one is on.
     *
     * The approach decides WHICH registry it reads, never WHERE the control
     * lives: a generated clip is made by a video model, everything else is
     * written by the design model, and both appear in the same slot beside the
     * send button. Consistency here is not tidiness — a control that moves
     * between tabs reads as a different control.
     */
    const pickerModels = useMemo(
        () => (needsModel ? videoModels.map((m) => asPickerModel(m, plan)) : designModels),
        [needsModel, videoModels, designModels, plan]
    );
    const pickerSelected = needsModel ? model?.id ?? "" : designModel;

    // An approach with no model to run on, said in the same voice as a feature
    // that has not shipped — because from here it is the same thing.
    const comingSoon: ComingSoon | undefined =
        approach?.comingSoon ?? (needsModel && !videoModels.length ? NO_VIDEO_MODEL : undefined);

    /**
     * The slots actually offered.
     *
     * For AI video this is the MODEL's capabilities, not the approach's wish
     * list: an end-frame slot on a model without keyframes is a control that
     * takes the user's money and ignores them, and the backend refuses the
     * combination anyway — so the slot is not drawn rather than drawn and
     * rejected.
     */
    const refSlots = useMemo(() => {
        if (!approach) return [];
        if (approach.id !== "genvideo") return approach.refs;
        return approach.refs.filter((slot) => {
            if (slot.key === "startFrame") return !!model?.startFrame;
            if (slot.key === "endFrame") return !!model?.endFrame;
            return true;
        });
    }, [approach, model?.startFrame, model?.endFrame]);

    // A required slot with nothing in it is the one thing that blocks send —
    // the approach genuinely has no work to do without it.
    const missingRequired = useMemo(
        () =>
            !!approach?.refs.some(
                (slot) => slot.required && !refs[slot.key]
            ),
        [approach, refs]
    );

    const canSend =
        !!approach && !comingSoon && !!prompt.trim() && !missingRequired && !disabled;

    const submit = useCallback(() => {
        if (!canSend || !approach) return;
        const settingsChanged = visibleSettings.some((k) => settings[k] !== defaults[k]);
        track("content_brief_submitted", {
            approach: approach.id,
            has_refs: hasAnyRef(refs),
            settings_changed: settingsChanged,
        });
        onSubmit({
            approach: approach.id,
            prompt: prompt.trim(),
            refs,
            settings,
            modelId: needsModel ? model?.id : undefined,
        });
    }, [
        canSend,
        approach,
        prompt,
        refs,
        settings,
        defaults,
        visibleSettings,
        needsModel,
        model?.id,
        onSubmit,
    ]);

    if (!approach) return null;

    return (
        <View style={styles.wrap}>
            {/* Tabs. Coming-soon ones keep full weight — see ComingSoonPanel. */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabs}
                keyboardShouldPersistTaps="handled"
            >
                {approaches.map((a) => {
                    const active = a.id === approachId;
                    return (
                        <Pressable
                            key={a.id}
                            style={({ pressed }) => [
                                styles.tab,
                                active && styles.tabActive,
                                pressed && styles.pressed,
                            ]}
                            onPress={() => switchApproach(a.id)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={a.title}
                        >
                            <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                {a.tab}
                            </Text>
                            {a.comingSoon ? (
                                <View style={styles.soonPill}>
                                    <Text style={styles.soonPillText}>Soon</Text>
                                </View>
                            ) : null}
                        </Pressable>
                    );
                })}
            </ScrollView>

            <Text style={styles.description}>{approach.description}</Text>

            {comingSoon ? (
                <ComingSoonPanel
                    approach={approach}
                    comingSoon={comingSoon}
                    hadPrompt={!!prompt.trim()}
                />
            ) : (
                <>
                    <View style={styles.card}>
                        {/* The model, above the references: it decides what the
                            slots and the length can even be, so it is the first
                            choice rather than one buried in the strip. A single
                            model is stated rather than offered — a picker with
                            one option implies a decision that does not exist. */}
                        {/* Footage is read before it is cut. A single model is
                            stated rather than offered — a picker with one
                            option implies a decision that does not exist —
                            and no model at all says so, because the trim still
                            works without a transcript. */}
                        {approach.id === "footage" ? (
                            <View style={styles.models}>
                                <Text style={styles.modelOnly}>
                                    {sttModels.length
                                        ? `Read by ${sttModels[0].displayName}`
                                        : "Transcription isn't switched on — you'll trim this by hand"}
                                </Text>
                            </View>
                        ) : null}

                        <ReferenceTray
                            slots={refSlots}
                            refs={refs}
                            onChange={setRefs}
                            disabled={disabled}
                        />

                        <TextInput
                            style={styles.prompt}
                            value={prompt}
                            onChangeText={setPrompt}
                            placeholder={approach.placeholder}
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            autoFocus={xl}
                            editable={!disabled}
                            accessibilityLabel="Describe what to make"
                        />

                        <View style={styles.footer}>
                            <View style={styles.stripWrap}>
                                <SettingsStrip
                                    keys={visibleSettings}
                                    values={settings}
                                    onOpen={setOpenSetting}
                                    disabled={disabled}
                                />
                            </View>

                            {/* The model that will do the work, in the same
                                place on every approach. Which model it IS
                                changes — a brief goes to the design model, a
                                generated clip to a video model — but the
                                control does not move, because a control that
                                moves between tabs reads as a different
                                control. */}
                            <AIModelSelector
                                models={pickerModels}
                                selectedModel={pickerSelected}
                                onSelect={needsModel ? setModelId : setSelectedModel}
                                compact
                                surface="composer"
                                task={needsModel ? "video" : "design"}
                            />
                            <Pressable
                                style={({ pressed }) => [
                                    styles.send,
                                    !canSend && styles.sendDisabled,
                                    pressed && styles.pressed,
                                ]}
                                onPress={submit}
                                disabled={!canSend}
                                accessibilityRole="button"
                                accessibilityLabel={approach.cta}
                            >
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    size={15}
                                    color={colors.onPrimary}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {missingRequired ? (
                        <Text style={styles.blocked}>
                            Add {approach.refs.find((s) => s.required)?.label.toLowerCase()} to continue.
                        </Text>
                    ) : null}

                    {approach.starters.length && !prompt.trim() ? (
                        <View style={styles.starters}>
                            {approach.starters.map((s) => (
                                <Pressable
                                    key={s}
                                    style={({ pressed }) => [
                                        styles.starter,
                                        pressed && styles.pressed,
                                    ]}
                                    onPress={() => setPrompt(s)}
                                    disabled={disabled}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Use starter: ${s}`}
                                >
                                    <Text style={styles.starterText}>{s}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.converge}>
                        <FontAwesomeIcon
                            icon={faWandMagicSparkles}
                            size={11}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.convergeText}>
                            Switching approach keeps your prompt and anything you've attached.
                        </Text>
                    </View>
                </>
            )}

            <SettingSheet
                settingKey={openSetting}
                value={openSetting ? settings[openSetting] : undefined}
                contentType={contentType}
                overrideOptions={openSetting === "length" ? lengthOptions : undefined}
                onPick={(v) => {
                    if (openSetting) setSettings((cur) => ({ ...cur, [openSetting]: v }));
                    setOpenSetting(null);
                }}
                onClose={() => setOpenSetting(null)}
            />
        </View>
    );
};

const useStyles = (colors: any) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                /**
                 * The composer sits in a WELL, not on the section's card.
                 *
                 * Both surfaces used to be `colors.card`, so a card sat on an
                 * identical card and the whole thing read as one flat plane
                 * with two rows of tabs on it. Recessing the composer gives the
                 * prompt card something to lift off, and pushes the section
                 * chrome above it into the background where it belongs — the
                 * lane was chosen a step ago and is not the decision on screen.
                 */
                wrap: {
                    gap: 10,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: colors.tag,
                },
                tabs: {
                    flexDirection: "row",
                    gap: 4,
                    paddingRight: 8,
                },
                // On the well, an inactive tab takes the raised surface and the
                // active one keeps the fill — so the loudest thing in the
                // section is the approach you are on, which is the live choice.
                tab: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 13,
                    borderRadius: 9,
                    backgroundColor: colors.card,
                },
                tabActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 10,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                tabText: {
                    fontSize: fs(12.5),
                    lineHeight: lh(17),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                tabTextActive: {
                    color: colors.onPrimary,
                },
                soonPill: {
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: colors.card,
                },
                soonPillText: {
                    fontSize: fs(9),
                    lineHeight: lh(12),
                    fontWeight: "700",
                    color: colors.textSecondary,
                },
                description: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                },
                card: {
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 12,
                    // A little more lift than the section card's 0.07: this is
                    // the thing being used, sitting in a recess.
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 12,
                    shadowOpacity: 0.1,
                    elevation: 4,
                },
                models: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 5,
                    marginBottom: 10,
                },
                modelOnly: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                prompt: {
                    minHeight: 84,
                    fontSize: fs(14),
                    lineHeight: lh(20),
                    color: colors.text,
                    textAlignVertical: "top",
                    paddingTop: 2,
                    // No focus ring on web. The card is the field — the same
                    // call the chat composer already makes, and what every
                    // prompt box people use all day does: the surface says it
                    // is active, a hard outline around a multi-line box just
                    // boxes in the thing you are writing.
                    ...Platform.select({ web: { outlineStyle: "none" } as any }),
                },
                footer: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 10,
                },
                stripWrap: {
                    flex: 1,
                    minWidth: 0,
                },
                send: {
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                sendDisabled: {
                    opacity: 0.4,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                blocked: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                },
                starters: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                },
                starter: {
                    paddingVertical: 6,
                    paddingHorizontal: 11,
                    borderRadius: 999,
                    backgroundColor: colors.card,
                },
                starterText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    color: colors.textSecondary,
                },
                converge: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                },
                convergeText: {
                    flex: 1,
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                },
                pressed: {
                    opacity: 0.75,
                },
            }),
        [colors]
    );

export default Composer;
