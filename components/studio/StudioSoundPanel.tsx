/**
 * StudioSoundPanel — the document's sound: one voice, one music bed.
 *
 * ── Why both are document-level ─────────────────────────────────────────────
 * A music bed belongs to the whole thing by definition: a track that restarted
 * at every cut would be unlistenable. The VOICE is document-level for a
 * different and less obvious reason — two voices across a 30-second reel read as
 * two videos spliced together, so one voice is the default and a second speaker
 * is a deliberate exception that belongs on a cast member rather than on a
 * scene.
 *
 * ── What is NOT here ────────────────────────────────────────────────────────
 * The spoken lines. Those are per scene, anchored to the scene rather than to an
 * absolute millisecond, so reordering the rail cannot desynchronise the voice
 * from the picture. This panel chooses WHO speaks; the inspector chooses what
 * they say.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { TokenMeterNotice } from "@/components/billing/TokenMeter";
import { useEntitlements } from "@/hooks/use-entitlements";
import {
    IAudioLane,
    IStudio,
    IStudioAudio,
} from "@/shared-libs/firestore/trendly-pro/models/studio";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface Voice {
    voice_id: string;
    name: string;
    preview_url?: string;
}

export interface StudioSoundPanelProps {
    brandId: string;
    studio: IStudio;
    busy?: boolean;
    /** The timeline's length, so a generated bed is asked for at the right size. */
    totalMs?: number;
    /**
     * ⚠️ The audio object is REPLACED by this, not merged. So every caller here
     * spreads `studio.audio` first — a patch that sends only the field it
     * changed deletes the others, which is how the director's parked music
     * disappeared the first time somebody picked a voice.
     */
    onPatch: (input: { audio: IStudioAudio }) => void;
}

const StudioSoundPanel: React.FC<StudioSoundPanelProps> = ({
    brandId,
    studio,
    busy,
    totalMs,
    onPatch,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { tokens } = useEntitlements();

    const [voices, setVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(false);

    const lanes = studio.audio?.lanes ?? [];
    const music = lanes.find((l) => l.kind === "music");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        HttpWrapper.fetch("/api/media/voices")
            .then((r) => r.json())
            .then((json: { voices?: Voice[] }) => {
                if (!cancelled) setVoices(json.voices ?? []);
            })
            .catch(() => undefined)
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const setVoice = useCallback(
        (voiceId: string) => {
            onPatch({ audio: { ...studio.audio, lanes, voiceId } });
        },
        [lanes, studio.audio, onPatch]
    );

    // ── The bed the director planned ────────────────────────────────────────
    //
    // Parked at approval rather than applied, because generating costs money
    // the user has not agreed to spend and a studio may already have a bed.
    // Offered here, once, in one tap.
    const request = studio.audio?.musicRequest;
    const offered = !!request && !request.dismissed && !music;
    const [applying, setApplying] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);

    const laneFor = useCallback(
        (mediaId: string): IAudioLane => ({
            id: `music-${Date.now()}`,
            kind: "music",
            mediaId,
            // A bed runs from the top of the document by definition.
            fromStart: true,
            // Ducking on by default: a bed at full level under a voice is the
            // single commonest reason a render sounds amateur.
            duckMusic: true,
        }),
        []
    );

    const applyRequest = useCallback(async () => {
        if (!request) return;
        setRequestError(null);

        if (request.approach === "reuse") {
            if (!request.mediaId) return;
            onPatch({
                audio: {
                    ...studio.audio,
                    lanes: [...lanes, laneFor(request.mediaId)],
                    musicRequest: undefined,
                },
            });
            return;
        }

        setApplying(true);
        try {
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio/music`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: request.prompt,
                    // The bed is asked for at the timeline's length. A bed
                    // shorter than the video is the giveaway that nobody
                    // listened to the export.
                    lengthMs: totalMs && totalMs > 0 ? totalMs : undefined,
                    instrumental: true,
                    title: "Director's bed",
                }),
            });
            if (!res.ok) {
                // 402 is the wallet, and the meter above already says so —
                // this line is for everything else.
                setRequestError(
                    res.status === 402
                        ? "That needs tokens you don't have yet."
                        : "The bed didn't generate. Try again in a moment."
                );
                return;
            }
            const json = (await res.json()) as { mediaId?: string; id?: string };
            // `mediaId` is the library row. `id` is the generated-audio
            // document, which is NOT what a lane may reference — so a response
            // without a media id is a failure, not a fallback.
            if (!json.mediaId) {
                setRequestError("The bed generated but wasn't filed. Pick it from your media.");
                return;
            }
            onPatch({
                audio: {
                    ...studio.audio,
                    lanes: [...lanes, laneFor(json.mediaId)],
                    musicRequest: undefined,
                },
            });
        } catch {
            setRequestError("The bed didn't generate. Try again in a moment.");
        } finally {
            setApplying(false);
        }
    }, [request, studio.audio, lanes, laneFor, onPatch, brandId, totalMs]);

    const dismissRequest = useCallback(() => {
        if (!request) return;
        // Marked rather than deleted: the judgement behind "builds at 0:18" is
        // worth keeping even once it has been turned down.
        onPatch({
            audio: { ...studio.audio, lanes, musicRequest: { ...request, dismissed: true } },
        });
    }, [request, studio.audio, lanes, onPatch]);

    const setDucking = useCallback(
        (duck: boolean) => {
            onPatch({
                audio: {
                    ...studio.audio,
                    lanes: lanes.map((l) =>
                        l.kind === "music" ? { ...l, duckMusic: duck } : l
                    ),
                },
            });
        },
        [lanes, studio.audio, onPatch]
    );

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>The voice</Text>
            {tokens.state === "low" || tokens.state === "critical" ? (
                <TokenMeterNotice tokens={tokens} />
            ) : null}
            {loading ? (
                <ActivityIndicator color={colors.primary} />
            ) : voices.length === 0 ? (
                <Text style={styles.note}>No voices available right now.</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chips}>
                        {voices.slice(0, 12).map((v) => {
                            const on = studio.audio?.voiceId === v.voice_id;
                            return (
                                <Pressable
                                    key={v.voice_id}
                                    style={[styles.chip, on && styles.chipOn]}
                                    onPress={() => setVoice(v.voice_id)}
                                    disabled={busy}
                                >
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                        {v.name}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
            <Text style={styles.note}>
                One voice for the whole video. A second speaker reads as two videos spliced
                together.
            </Text>

            <Text style={styles.label}>Music under it</Text>
            {offered && request ? (
                <View style={styles.offer}>
                    <Text style={styles.offerTitle}>The director asked for a bed</Text>
                    <Text style={styles.offerBody}>
                        {request.approach === "generate"
                            ? request.prompt
                            : "A track already in your media."}
                    </Text>
                    {requestError ? <Text style={styles.offerError}>{requestError}</Text> : null}
                    <View style={styles.offerRow}>
                        <Pressable
                            style={styles.offerPrimary}
                            onPress={() => void applyRequest()}
                            disabled={busy || applying}
                        >
                            {applying ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.offerPrimaryLabel}>
                                    {request.approach === "generate" ? "Generate it" : "Use it"}
                                </Text>
                            )}
                        </Pressable>
                        <Pressable
                            style={styles.offerGhost}
                            onPress={dismissRequest}
                            disabled={busy || applying}
                        >
                            <Text style={styles.offerGhostLabel}>Not this one</Text>
                        </Pressable>
                    </View>
                </View>
            ) : null}
            {music ? (
                <>
                    <Text style={styles.note}>A bed is attached and runs from the top.</Text>
                    <Pressable
                        style={[styles.toggle, (music.duckMusic ?? true) && styles.toggleOn]}
                        onPress={() => setDucking(!(music.duckMusic ?? true))}
                        disabled={busy}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                (music.duckMusic ?? true) && styles.chipTextOn,
                            ]}
                        >
                            {(music.duckMusic ?? true)
                                ? "Ducks under the voice"
                                : "Stays at full level"}
                        </Text>
                    </Pressable>
                    {/* The single commonest reason a render sounds amateur, so
                        the default is on and the consequence is stated. */}
                    <Text style={styles.note}>
                        A bed at full level under a voice is the usual reason a video sounds
                        amateur.
                    </Text>
                </>
            ) : (
                <Text style={styles.note}>
                    No music yet. Generated beds and your own uploads both land in your media, so
                    one can be reused across posts.
                </Text>
            )}
            {/* Said plainly while it is true, and deleted the day the render
                carries sound. A bed that plays here and vanishes in the export
                is worse than no bed, because nobody checks an export they
                already heard. */}
            <Text style={styles.warn}>
                Sound plays in the studio only — the exported video is silent for now.
            </Text>
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                wrap: { gap: 8 },
                label: {
                    color: colors.textSecondary,
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                },
                chips: { flexDirection: "row", gap: 6 },
                chip: {
                    paddingHorizontal: 11,
                    paddingVertical: 8,
                    borderRadius: 8,
                    minHeight: fbox(34),
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                chipOn: { backgroundColor: colors.primary },
                chipText: { color: colors.text, fontSize: fs(11), lineHeight: lh(15) },
                chipTextOn: { color: colors.white, fontWeight: "600" },
                toggle: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 11,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: withAlpha(colors.text, 0.06),
                },
                toggleOn: { backgroundColor: withAlpha(colors.primary, 0.18) },
                note: { color: colors.textSecondary, fontSize: fs(10), lineHeight: lh(15) },
                warn: { color: colors.orange, fontSize: fs(10), lineHeight: lh(15) },
                offer: {
                    gap: 6,
                    padding: 10,
                    borderRadius: 12,
                    // Background contrast marks it as a card, never a border.
                    backgroundColor: withAlpha(colors.primary, 0.1),
                },
                offerTitle: {
                    color: colors.text,
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    fontWeight: "700",
                },
                offerBody: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(17) },
                offerError: { color: colors.red, fontSize: fs(10), lineHeight: lh(15) },
                offerRow: { flexDirection: "row", gap: 8, alignItems: "center" },
                offerPrimary: {
                    minHeight: fbox(30),
                    paddingHorizontal: 14,
                    justifyContent: "center",
                    borderRadius: 9,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 10,
                    shadowOpacity: 0.35,
                    elevation: 3,
                },
                offerPrimaryLabel: {
                    color: colors.white,
                    fontSize: fs(11),
                    lineHeight: lh(17),
                    fontWeight: "700",
                },
                offerGhost: { paddingHorizontal: 10, paddingVertical: 7 },
                offerGhostLabel: {
                    color: colors.textSecondary,
                    fontSize: fs(11),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
            }),
        [colors]
    );

export default StudioSoundPanel;
