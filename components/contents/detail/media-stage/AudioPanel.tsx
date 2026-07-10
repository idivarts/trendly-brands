/**
 * AudioPanel — generate a commercially-licensed music bed and/or an AI voiceover
 * for a video content via the backend ElevenLabs proxy. Metered against the org
 * token wallet (gate + meter enforced on both sides); the exhausted state blocks
 * generation and points to billing.
 */
import { useEntitlements } from "@/hooks/use-entitlements";
import { IContentAudio } from "@/shared-libs/firestore/trendly-pro/models/design";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { faMicrophone, faMusic, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { TokenMeterBar, TokenMeterNotice } from "../../../billing/TokenMeter";

interface AudioPanelProps {
    brandId: string;
    /** Source text for the voiceover (script or caption). */
    voiceoverSource: string;
    audio?: IContentAudio;
    onAudioChange: (audio: IContentAudio) => void;
    readOnly?: boolean;
}

const AudioPanel: React.FC<AudioPanelProps> = ({
    brandId,
    voiceoverSource,
    audio,
    onAudioChange,
    readOnly,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { tokens } = useEntitlements();
    const exhausted = tokens.state === "exhausted";

    const [musicPrompt, setMusicPrompt] = useState("");
    const [busyMusic, setBusyMusic] = useState(false);
    const [busyVoice, setBusyVoice] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const styles = useStyles(colors);

    const generateMusic = async () => {
        if (!musicPrompt.trim() || exhausted) return;
        setBusyMusic(true);
        setError(null);
        try {
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio/music`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ prompt: musicPrompt, lengthMs: 20000, instrumental: true }),
            });
            const data = await res.json();
            onAudioChange({ ...audio, musicId: data.id, musicUrl: data.url, duckMusic: true });
        } catch (e) {
            setError("Couldn't generate music. Try again.");
        } finally {
            setBusyMusic(false);
        }
    };

    const generateVoiceover = async (enable: boolean) => {
        if (!enable) {
            onAudioChange({ ...audio, voiceoverId: undefined, voiceoverUrl: undefined });
            return;
        }
        if (!voiceoverSource.trim() || exhausted) {
            setError("Add a script or caption first to voice over.");
            return;
        }
        setBusyVoice(true);
        setError(null);
        try {
            const voices = await HttpWrapper.fetch(`/api/media/voices`).then((r) => r.json());
            const voiceId = voices?.voices?.[0]?.voice_id;
            if (!voiceId) throw new Error("no voice");
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio/voiceover`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ text: voiceoverSource, voiceId }),
            });
            const data = await res.json();
            onAudioChange({ ...audio, voiceoverId: data.id, voiceoverUrl: data.url });
        } catch (e) {
            setError("Couldn't generate the voiceover. Try again.");
        } finally {
            setBusyVoice(false);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Audio</Text>
                <View style={styles.meter}>
                    <TokenMeterBar tokens={tokens} />
                </View>
            </View>
            <TokenMeterNotice tokens={tokens} />

            {/* Music bed */}
            <View style={styles.row}>
                <FontAwesomeIcon icon={faMusic} size={15} color={colors.text} />
                <TextInput
                    style={styles.input}
                    placeholder="Describe the music — e.g. upbeat lofi, no vocals"
                    placeholderTextColor={colors.textSecondary}
                    value={musicPrompt}
                    onChangeText={setMusicPrompt}
                    editable={!readOnly && !exhausted}
                />
                <Pressable
                    style={[styles.genBtn, (busyMusic || exhausted) && styles.genBtnDisabled]}
                    onPress={generateMusic}
                    disabled={busyMusic || exhausted || readOnly}
                >
                    {busyMusic ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <FontAwesomeIcon icon={faWandMagicSparkles} size={14} color="#fff" />
                    )}
                </Pressable>
            </View>
            {audio?.musicUrl ? <Text style={styles.ok}>Music bed added</Text> : null}

            {/* Voiceover */}
            <View style={styles.row}>
                <FontAwesomeIcon icon={faMicrophone} size={15} color={colors.text} />
                <Text style={styles.voLabel}>AI voiceover from script</Text>
                {busyVoice ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Switch
                        value={!!audio?.voiceoverUrl}
                        onValueChange={generateVoiceover}
                        disabled={readOnly || exhausted}
                    />
                )}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
};

const useStyles = (colors: any) =>
    useMemo(
        () =>
            StyleSheet.create({
                card: {
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    padding: 12,
                    gap: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                title: { fontSize: 15, fontWeight: "600", color: colors.text },
                meter: { width: 90 },
                row: { flexDirection: "row", alignItems: "center", gap: 10 },
                input: {
                    flex: 1,
                    height: 40,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    color: colors.text,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                genBtn: {
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                genBtnDisabled: { opacity: 0.5 },
                voLabel: { flex: 1, fontSize: 14, color: colors.text },
                ok: { fontSize: 12, color: colors.success ?? colors.primary },
                error: { fontSize: 12, color: colors.error },
            }),
        [colors]
    );

export default AudioPanel;
