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
import { withAlpha } from "@/utils/color";
import { faArrowUp, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
    SettingKey,
    approachesFor,
    defaultApproachFor,
    defaultSettings,
    settingsFor,
} from "./approach-spec";

/** Everything the composer collected, handed to whoever runs the generation. */
export interface ComposerBrief {
    approach: ApproachId;
    prompt: string;
    refs: ComposerRefs;
    settings: Partial<Record<SettingKey, string>>;
}

interface Props {
    contentType: ContentType;
    onSubmit: (brief: ComposerBrief) => void;
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

const Composer: React.FC<Props> = ({ contentType, onSubmit, disabled }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);

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

    // A required slot with nothing in it is the one thing that blocks send —
    // the approach genuinely has no work to do without it.
    const missingRequired = useMemo(
        () =>
            !!approach?.refs.some(
                (slot) => slot.required && !refs[slot.key]
            ),
        [approach, refs]
    );

    const canSend = !!approach && !approach.comingSoon && !!prompt.trim() && !missingRequired && !disabled;

    const submit = useCallback(() => {
        if (!canSend || !approach) return;
        const settingsChanged = visibleSettings.some((k) => settings[k] !== defaults[k]);
        track("content_brief_submitted", {
            approach: approach.id,
            has_refs: hasAnyRef(refs),
            settings_changed: settingsChanged,
        });
        onSubmit({ approach: approach.id, prompt: prompt.trim(), refs, settings });
    }, [canSend, approach, prompt, refs, settings, defaults, visibleSettings, onSubmit]);

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

            {approach.comingSoon ? (
                <ComingSoonPanel approach={approach} hadPrompt={!!prompt.trim()} />
            ) : (
                <>
                    <View style={styles.card}>
                        <ReferenceTray
                            slots={approach.refs}
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
                wrap: {
                    gap: 8,
                },
                tabs: {
                    flexDirection: "row",
                    gap: 4,
                    paddingRight: 8,
                },
                tab: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 13,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                tabActive: {
                    backgroundColor: colors.primary,
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
                    borderRadius: 14,
                    padding: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 10,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                prompt: {
                    minHeight: 84,
                    fontSize: fs(14),
                    lineHeight: lh(20),
                    color: colors.text,
                    textAlignVertical: "top",
                    paddingTop: 2,
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
                    backgroundColor: colors.tag,
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
