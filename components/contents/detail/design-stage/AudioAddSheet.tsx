/**
 * AudioAddSheet — the one place audio gets created or chosen.
 *
 * Two modes in one sheet because they are the same shape of decision: describe
 * what you want, or reuse something you already made. It is a modal rather than
 * a permanent panel so the canvas is never hidden behind the controls for its
 * own audio — the old bottom sheet narrowed the design above it, which is the
 * exact complaint video editors get about volume dialogs covering the timeline.
 *
 * Three things the old flow did not do, all of which come from the sheet
 * knowing the video's length:
 *   - Music is generated AT the video's length instead of a hardcoded 20s, so a
 *     9s reel stops paying for 20s of audio and a 40s one stops looping twice.
 *   - The length is stated, not asked. It is not a decision the user should
 *     have to make, and the old panel did not even let them.
 *   - The voiceover text is EDITABLE. It used to silently read the entire
 *     script, including the scene directions and the bracketed notes.
 */
import { fs, lh } from "@/constants/Typography";
import { useSubscribeNudge } from "@/contexts/subscribe-nudge-context.provider";
import { useEntitlements } from "@/hooks/use-entitlements";
import { IContentAudio, IVoice } from "@/shared-libs/firestore/trendly-pro/models/design";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { track } from "@/shared-libs/utils/analytics";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faPause,
    faPlay,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { UpgradeInline } from "@/components/billing/EntitlementGate";
import { useAudition } from "./use-audio-player";

/**
 * Starting points, not filters.
 *
 * The old chips filtered a curated library that was empty, so every one of them
 * returned nothing. These write a usable prompt into the box instead, which is
 * what someone staring at an empty field actually needs.
 */
const STARTERS: { label: string; prompt: string }[] = [
    { label: "Upbeat", prompt: "Upbeat, bright, modern pop bed. Driving but not busy. No vocals." },
    { label: "Calm", prompt: "Calm, warm lo-fi bed. Soft keys, gentle pulse, plenty of space. No vocals." },
    { label: "Cinematic", prompt: "Cinematic build. Sparse strings opening to a warm, hopeful swell. No vocals." },
    { label: "Confident", prompt: "Confident, understated corporate bed. Clean rhythm, no fanfare. No vocals." },
    { label: "Playful", prompt: "Playful, light, slightly quirky bed. Plucky and friendly. No vocals." },
];

interface GenAudio {
    id: string;
    title?: string;
    prompt?: string;
    url: string;
    durationMs?: number;
    createdAt?: number;
}

const fmt = (ms?: number) => (ms ? `${Math.round(ms / 1000)}s` : "");

interface Props {
    mode: "music" | "voice" | null;
    brandId: string;
    videoMs: number;
    /** The script or caption, used as the starting text for a voiceover. */
    voiceoverSource: string;
    audio?: IContentAudio;
    onAudioChange: (audio: IContentAudio) => void;
    onClose: () => void;
}

const AudioAddSheet: React.FC<Props> = ({
    mode,
    brandId,
    videoMs,
    voiceoverSource,
    audio,
    onAudioChange,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { tokens } = useEntitlements();
    const { maybeNudge } = useSubscribeNudge();
    const audition = useAudition();

    const exhausted = tokens.state === "exhausted";
    const [prompt, setPrompt] = useState("");
    const [voiceText, setVoiceText] = useState("");
    const [voices, setVoices] = useState<IVoice[]>([]);
    const [voiceId, setVoiceId] = useState<string | undefined>(audio?.voiceoverId);
    const [mine, setMine] = useState<GenAudio[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const patch = (p: Partial<IContentAudio>) => onAudioChange({ ...audio, ...p });

    useEffect(() => {
        if (!mode) return;
        setError(null);
        audition.stop();
        if (mode === "voice") {
            // Pre-filled, not imposed. A script carries scene directions and
            // bracketed notes that nobody wants read aloud.
            setVoiceText((t) => t || voiceoverSource.trim());
            HttpWrapper.fetch(`/api/media/voices`)
                .then((r) => r.json())
                .then((d) => {
                    const list: IVoice[] = (d.voices ?? []).slice(0, 8);
                    setVoices(list);
                    setVoiceId((v) => v || audio?.voiceoverId || list[0]?.voice_id);
                })
                .catch(() => setVoices([]));
        } else {
            HttpWrapper.fetch(`/api/media/brands/${brandId}/audio?kind=music`)
                .then((r) => r.json())
                .then((d) => setMine(d.audio ?? []))
                .catch(() => setMine([]));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const useExisting = (a: GenAudio) => {
        patch({
            musicId: a.id,
            musicUrl: a.url,
            musicTitle: a.title || "Music",
            musicVolume: audio?.musicVolume ?? 0.7,
            duckMusic: audio?.duckMusic ?? true,
        });
        onClose();
    };

    const generateMusic = async () => {
        const p = prompt.trim();
        if (!p || exhausted || busy) return;
        if (tokens.state === "low" || tokens.state === "critical") maybeNudge("generate_low_tokens");
        setBusy(true);
        setError(null);
        // A short name from the starter the user picked, falling back to the
        // first few words. The backend stores it so the picker has something
        // to print other than a truncated prompt.
        const starter = STARTERS.find((s) => s.prompt === p);
        const title = starter ? `${starter.label} bed` : p.split(/[,.]/)[0].slice(0, 28);
        track("ai_generation_requested", { kind: "music" });
        try {
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio/music`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    prompt: p,
                    title,
                    // The video's length, not a fixed 20s. Cost scales with
                    // duration, so this is also the cheaper default.
                    lengthMs: Math.round(videoMs) || undefined,
                    instrumental: true,
                }),
            });
            const d = await res.json();
            patch({
                musicId: d.id,
                musicUrl: d.url,
                musicTitle: d.title || title,
                musicVolume: audio?.musicVolume ?? 0.7,
                duckMusic: audio?.duckMusic ?? true,
            });
            track("ai_generation_completed", { kind: "music", success: true });
            onClose();
        } catch (e: any) {
            track("ai_generation_completed", { kind: "music", success: false });
            setError(
                e?.status === 402
                    ? "You're out of AI tokens this month."
                    : "Couldn't generate that. Try again, or reuse a track below."
            );
        } finally {
            setBusy(false);
        }
    };

    const generateVoice = async () => {
        const text = voiceText.trim();
        if (!text || !voiceId || exhausted || busy) return;
        if (tokens.state === "low" || tokens.state === "critical") maybeNudge("generate_low_tokens");
        setBusy(true);
        setError(null);
        track("ai_generation_requested", { kind: "voiceover" });
        try {
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio/voiceover`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ text, voiceId }),
            });
            const d = await res.json();
            patch({
                voiceoverId: d.id,
                voiceoverUrl: d.url,
                voiceoverVolume: audio?.voiceoverVolume ?? 1,
                duckMusic: audio?.duckMusic ?? true,
            });
            track("ai_generation_completed", { kind: "voiceover", success: true });
            onClose();
        } catch (e: any) {
            track("ai_generation_completed", { kind: "voiceover", success: false });
            setError(
                e?.status === 402
                    ? "You're out of AI tokens this month."
                    : "Couldn't generate the voiceover. Try again."
            );
        } finally {
            setBusy(false);
        }
    };

    // Roughly what the text will take to read aloud, so an overrun is visible
    // BEFORE paying for it rather than after. ~2.5 words a second, the same
    // figure the script checks use.
    const spokenMs = useMemo(() => {
        const words = voiceText.trim().split(/\s+/).filter(Boolean).length;
        return words ? (words / 2.5) * 1000 : 0;
    }, [voiceText]);
    const voiceOverruns = spokenMs > 0 && videoMs > 0 && spokenMs > videoMs * 1.1;

    const isMusic = mode === "music";

    return (
        <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={() => {}}>
                    <View style={styles.head}>
                        <Text style={styles.title}>{isMusic ? "Add music" : "Add voiceover"}</Text>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faXmark} size={14} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
                        {isMusic ? (
                            <>
                                <Text style={styles.hint}>
                                    Describe the bed you want. It will be made{" "}
                                    {videoMs > 0 ? `${(videoMs / 1000).toFixed(1)}s long, to match this video` : "to match this video"}.
                                </Text>
                                <View style={styles.chips}>
                                    {STARTERS.map((s) => (
                                        <Pressable
                                            key={s.label}
                                            onPress={() => setPrompt(s.prompt)}
                                            style={({ pressed }) => [
                                                styles.chip,
                                                prompt === s.prompt && styles.chipActive,
                                                pressed && styles.pressed,
                                            ]}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Start from ${s.label}`}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    prompt === s.prompt && styles.chipTextActive,
                                                ]}
                                            >
                                                {s.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. warm lo-fi bed, soft keys, no vocals"
                                    placeholderTextColor={colors.textSecondary}
                                    value={prompt}
                                    onChangeText={setPrompt}
                                    multiline
                                />

                                {mine.length > 0 ? (
                                    <>
                                        <Text style={styles.sectionLabel}>
                                            OR REUSE ONE YOU ALREADY MADE
                                        </Text>
                                        {mine.map((a) => (
                                            <View key={a.id} style={styles.row}>
                                                <Pressable
                                                    onPress={() => audition.toggle(a.url)}
                                                    style={({ pressed }) => [styles.play, pressed && styles.pressed]}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Preview ${a.title || "track"}`}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={audition.playingUrl === a.url ? faPause : faPlay}
                                                        size={10}
                                                        color={colors.text}
                                                    />
                                                </Pressable>
                                                <View style={styles.rowBody}>
                                                    <Text style={styles.rowTitle} numberOfLines={1}>
                                                        {a.title || "Untitled track"}
                                                    </Text>
                                                    {a.prompt && a.title ? (
                                                        <Text style={styles.rowSub} numberOfLines={1}>
                                                            {a.prompt}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                                <Text style={styles.rowDur}>{fmt(a.durationMs)}</Text>
                                                <Pressable
                                                    onPress={() => useExisting(a)}
                                                    style={({ pressed }) => [styles.useBtn, pressed && styles.pressed]}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Use ${a.title || "this track"}`}
                                                >
                                                    <Text style={styles.useBtnText}>Use</Text>
                                                </Pressable>
                                            </View>
                                        ))}
                                    </>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <Text style={styles.hint}>
                                    Edit what gets read aloud — scene directions and notes should come out.
                                </Text>
                                <TextInput
                                    style={[styles.input, styles.inputTall]}
                                    placeholder="The words to speak"
                                    placeholderTextColor={colors.textSecondary}
                                    value={voiceText}
                                    onChangeText={setVoiceText}
                                    multiline
                                />
                                <Text style={[styles.hint, voiceOverruns && { color: colors.statusReviewFg }]}>
                                    {voiceText.trim()
                                        ? `About ${(spokenMs / 1000).toFixed(0)}s spoken${
                                              videoMs > 0 ? ` · video is ${(videoMs / 1000).toFixed(1)}s` : ""
                                          }${voiceOverruns ? " — trim it or it will be cut off" : ""}`
                                        : "Nothing to read yet."}
                                </Text>

                                <Text style={styles.sectionLabel}>VOICE</Text>
                                <View style={styles.chips}>
                                    {voices.map((v) => {
                                        const sel = voiceId === v.voice_id;
                                        return (
                                            <Pressable
                                                key={v.voice_id}
                                                onPress={() => setVoiceId(v.voice_id)}
                                                style={({ pressed }) => [
                                                    styles.voiceChip,
                                                    sel && styles.chipActive,
                                                    pressed && styles.pressed,
                                                ]}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Use the voice ${v.name}`}
                                            >
                                                <Pressable
                                                    onPress={() => v.preview_url && audition.toggle(v.preview_url)}
                                                    hitSlop={6}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Hear ${v.name}`}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={
                                                            audition.playingUrl === v.preview_url ? faPause : faPlay
                                                        }
                                                        size={10}
                                                        color={sel ? colors.primary : colors.textSecondary}
                                                    />
                                                </Pressable>
                                                <Text
                                                    style={[styles.chipText, sel && styles.chipTextActive]}
                                                >
                                                    {v.name}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        {error ? <Text style={styles.error}>{error}</Text> : null}
                    </ScrollView>

                    {exhausted ? (
                        <UpgradeInline
                            message="You're out of AI tokens this month."
                            ctaLabel="Add tokens"
                            feature={isMusic ? "music_generation" : "voiceover_generation"}
                            reason="tokens_exhausted"
                        />
                    ) : (
                        <Pressable
                            onPress={isMusic ? generateMusic : generateVoice}
                            disabled={busy || (isMusic ? !prompt.trim() : !voiceText.trim() || !voiceId)}
                            style={({ pressed }) => [
                                styles.cta,
                                (busy || (isMusic ? !prompt.trim() : !voiceText.trim() || !voiceId)) &&
                                    styles.disabled,
                                pressed && styles.pressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={isMusic ? "Generate music" : "Generate the voiceover"}
                        >
                            {busy ? (
                                <ActivityIndicator size="small" color={colors.onPrimary} />
                            ) : (
                                <FontAwesomeIcon icon={faWandMagicSparkles} size={13} color={colors.onPrimary} />
                            )}
                            <Text style={styles.ctaText}>
                                {busy ? "Generating…" : isMusic ? "Generate music" : "Generate voiceover"}
                            </Text>
                        </Pressable>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                pressed: { opacity: 0.75 },
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 520,
                    maxHeight: "86%",
                    gap: 12,
                    borderRadius: 16,
                    backgroundColor: colors.card,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowRadius: 28,
                    shadowOpacity: 0.22,
                    elevation: 12,
                },
                head: { flexDirection: "row", alignItems: "center" },
                title: { flex: 1, fontSize: fs(16), fontWeight: "800", color: colors.text },
                close: { padding: 4 },
                body: { flexGrow: 0 },
                bodyInner: { gap: 10 },
                hint: { fontSize: fs(12), lineHeight: lh(17), color: colors.textSecondary },
                chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
                chip: {
                    minHeight: 32,
                    justifyContent: "center",
                    paddingHorizontal: 12,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                voiceChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    minHeight: 32,
                    paddingHorizontal: 12,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                chipActive: { backgroundColor: withAlpha(colors.primary, 0.14) },
                chipText: { fontSize: fs(12), fontWeight: "600", color: colors.text },
                chipTextActive: { color: colors.primary, fontWeight: "700" },
                input: {
                    minHeight: 68,
                    borderRadius: 11,
                    backgroundColor: colors.tag,
                    padding: 11,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    color: colors.text,
                    textAlignVertical: "top",
                },
                inputTall: { minHeight: 120 },
                sectionLabel: {
                    marginTop: 4,
                    fontSize: fs(10),
                    fontWeight: "800",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                },
                row: { flexDirection: "row", alignItems: "center", gap: 9 },
                play: {
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                rowBody: { flex: 1 },
                rowTitle: { fontSize: fs(12.5), fontWeight: "600", color: colors.text },
                rowSub: { fontSize: fs(10.5), color: colors.textSecondary },
                rowDur: { fontSize: fs(11), color: colors.textSecondary },
                useBtn: {
                    minHeight: 28,
                    justifyContent: "center",
                    paddingHorizontal: 11,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                useBtnText: { fontSize: fs(12), fontWeight: "700", color: colors.primary },
                error: { fontSize: fs(12), lineHeight: lh(17), color: colors.statusRejectedFg },
                cta: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 44,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                ctaText: { fontSize: fs(14), fontWeight: "700", color: colors.onPrimary },
                disabled: { opacity: 0.45 },
            }),
        [colors]
    );
}

export default AudioAddSheet;
