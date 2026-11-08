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
import { IAudioLane, IStudio } from "@/shared-libs/firestore/trendly-pro/models/studio";
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
    onPatch: (input: { audio: { lanes: IAudioLane[]; voiceId?: string } }) => void;
}

const StudioSoundPanel: React.FC<StudioSoundPanelProps> = ({
    brandId,
    studio,
    busy,
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
            onPatch({ audio: { lanes, voiceId } });
        },
        [lanes, onPatch]
    );

    const setDucking = useCallback(
        (duck: boolean) => {
            onPatch({
                audio: {
                    voiceId: studio.audio?.voiceId,
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
            }),
        [colors]
    );

export default StudioSoundPanel;
