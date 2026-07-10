/**
 * SoundtrackPanel — the rebuilt video audio module (replaces AudioPanel).
 * Audition-first: search a curated, licensed music library, preview tracks inline,
 * select one as the bed; pick a voice (with sample previews) for an AI voiceover
 * from the script; control volume + fade + auto-duck. Browsing/selecting is free;
 * only generation meters the token wallet. Persists to content.audio.
 */
import { useEntitlements } from "@/hooks/use-entitlements";
import { IContentAudio, IMusicTrack, IVoice } from "@/shared-libs/firestore/trendly-pro/models/design";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import {
    faMicrophone,
    faMusic,
    faPause,
    faPlay,
    faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { TokenMeterBar, TokenMeterNotice } from "../../../billing/TokenMeter";
import { useAudition } from "./use-audio-player";

const MOODS = ["upbeat", "cinematic", "corporate", "chill", "dramatic"];

interface SoundtrackPanelProps {
    brandId: string;
    voiceoverSource: string;
    audio?: IContentAudio;
    onAudioChange: (audio: IContentAudio) => void;
    readOnly?: boolean;
}

const SoundtrackPanel: React.FC<SoundtrackPanelProps> = ({
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
    const audition = useAudition();
    const styles = useStyles(colors);

    const [mood, setMood] = useState<string>("");
    const [query, setQuery] = useState("");
    const [tracks, setTracks] = useState<IMusicTrack[]>([]);
    const [loadingTracks, setLoadingTracks] = useState(false);
    const [genPrompt, setGenPrompt] = useState("");
    const [genBusy, setGenBusy] = useState(false);

    const [voices, setVoices] = useState<IVoice[]>([]);
    const [voiceBusy, setVoiceBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // The brand's previously generated music — reusable so they never pay twice.
    const [myTracks, setMyTracks] = useState<IMusicTrack[]>([]);

    const loadMyTracks = async () => {
        try {
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio?kind=music`);
            const d = await res.json();
            setMyTracks(
                (d.audio ?? []).map((a: any) => ({
                    id: a.id,
                    title: a.prompt ? String(a.prompt).slice(0, 40) : "Generated track",
                    moods: ["generated"],
                    url: a.url,
                    durationMs: a.durationMs ?? 0,
                    provider: "elevenlabs",
                }))
            );
        } catch {
            setMyTracks([]);
        }
    };

    const selectedVoiceId = audio?.voiceoverId || voices[0]?.voice_id;

    const loadLibrary = async (m: string, q: string) => {
        setLoadingTracks(true);
        try {
            const qs = new URLSearchParams();
            if (m) qs.set("mood", m);
            if (q) qs.set("q", q);
            const res = await HttpWrapper.fetch(`/api/media/music/library?${qs.toString()}`);
            const data = await res.json();
            setTracks(data.tracks ?? []);
        } catch {
            setTracks([]);
        } finally {
            setLoadingTracks(false);
        }
    };

    useEffect(() => {
        loadLibrary(mood, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mood]);

    useEffect(() => {
        HttpWrapper.fetch(`/api/media/voices`)
            .then((r) => r.json())
            .then((d) => setVoices((d.voices ?? []).slice(0, 8)))
            .catch(() => setVoices([]));
        loadMyTracks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const patch = (p: Partial<IContentAudio>) => onAudioChange({ ...audio, ...p });

    const useTrack = (t: IMusicTrack) =>
        patch({
            musicId: t.id,
            musicUrl: t.url,
            musicTitle: t.title,
            musicVolume: audio?.musicVolume ?? 0.7,
            duckMusic: audio?.duckMusic ?? true,
        });

    const generateMusic = async () => {
        if (!genPrompt.trim() || exhausted) return;
        setGenBusy(true);
        setError(null);
        try {
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio/music`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ prompt: genPrompt, lengthMs: 20000, instrumental: true }),
            });
            const d = await res.json();
            patch({ musicId: d.id, musicUrl: d.url, musicTitle: "Generated", musicVolume: audio?.musicVolume ?? 0.7, duckMusic: true });
            loadMyTracks(); // keep it reusable so it's never regenerated
        } catch {
            setError("Couldn't generate music. Try again.");
        } finally {
            setGenBusy(false);
        }
    };

    const generateVoice = async () => {
        if (!voiceoverSource.trim()) {
            setError("Add a script or caption first to voice over.");
            return;
        }
        if (!selectedVoiceId || exhausted) return;
        setVoiceBusy(true);
        setError(null);
        try {
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio/voiceover`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ text: voiceoverSource, voiceId: selectedVoiceId }),
            });
            const d = await res.json();
            patch({ voiceoverId: d.id, voiceoverUrl: d.url, voiceoverVolume: audio?.voiceoverVolume ?? 1 });
        } catch {
            setError("Couldn't generate the voiceover. Try again.");
        } finally {
            setVoiceBusy(false);
        }
    };

    const PlayBtn = ({ url }: { url?: string }) => (
        <Pressable
            style={styles.playBtn}
            onPress={() => url && audition.toggle(url)}
            disabled={!url}
            accessibilityLabel="Preview"
        >
            <FontAwesomeIcon icon={audition.playingUrl === url ? faPause : faPlay} size={12} color={colors.text} />
        </Pressable>
    );

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Soundtrack</Text>
                <View style={styles.meter}>
                    <TokenMeterBar tokens={tokens} />
                </View>
            </View>
            <TokenMeterNotice tokens={tokens} />

            {/* ── Music ── */}
            <View style={styles.searchRow}>
                <FontAwesomeIcon icon={faMusic} size={14} color={colors.textSecondary} />
                <TextInput
                    style={styles.search}
                    placeholder="Search music"
                    placeholderTextColor={colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={() => loadLibrary(mood, query)}
                    editable={!readOnly}
                />
            </View>
            <View style={styles.chips}>
                {MOODS.map((m) => (
                    <Pressable key={m} onPress={() => setMood(mood === m ? "" : m)} style={[styles.chip, mood === m && styles.chipActive]}>
                        <Text style={[styles.chipText, mood === m && styles.chipTextActive]}>{m}</Text>
                    </Pressable>
                ))}
            </View>

            {loadingTracks ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            ) : (
                <View style={styles.list}>
                    {tracks.length === 0 ? (
                        <Text style={styles.empty}>No tracks yet — try a mood, or generate one below.</Text>
                    ) : (
                        tracks.map((t) => {
                            const selected = audio?.musicId === t.id;
                            return (
                                <View key={t.id} style={[styles.row, selected && styles.rowSelected]}>
                                    <PlayBtn url={t.url} />
                                    <View style={styles.rowMeta}>
                                        <Text style={styles.rowTitle}>{t.title}</Text>
                                        <Text style={styles.rowSub}>
                                            {(t.moods || []).join(", ")} · {Math.round(t.durationMs / 1000)}s
                                        </Text>
                                    </View>
                                    {selected ? (
                                        <Text style={styles.added}>Added</Text>
                                    ) : (
                                        <Pressable style={styles.useBtn} onPress={() => useTrack(t)} disabled={readOnly}>
                                            <Text style={styles.useBtnText}>Use</Text>
                                        </Pressable>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            )}

            {/* Your tracks — reuse past generations (no new cost) */}
            {myTracks.length > 0 ? (
                <>
                    <Text style={styles.sectionLabel}>Your tracks</Text>
                    <View style={styles.list}>
                        {myTracks.map((t) => {
                            const selected = audio?.musicId === t.id;
                            return (
                                <View key={t.id} style={[styles.row, selected && styles.rowSelected]}>
                                    <PlayBtn url={t.url} />
                                    <View style={styles.rowMeta}>
                                        <Text style={styles.rowTitle} numberOfLines={1}>
                                            {t.title}
                                        </Text>
                                        <Text style={styles.rowSub}>
                                            generated{t.durationMs ? ` · ${Math.round(t.durationMs / 1000)}s` : ""}
                                        </Text>
                                    </View>
                                    {selected ? (
                                        <Text style={styles.added}>Added</Text>
                                    ) : (
                                        <Pressable style={styles.useBtn} onPress={() => useTrack(t)} disabled={readOnly}>
                                            <Text style={styles.useBtnText}>Use</Text>
                                        </Pressable>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </>
            ) : null}

            {/* Generate fallback */}
            <View style={styles.genRow}>
                <TextInput
                    style={styles.genInput}
                    placeholder="Can't find it? Describe music to generate"
                    placeholderTextColor={colors.textSecondary}
                    value={genPrompt}
                    onChangeText={setGenPrompt}
                    editable={!readOnly && !exhausted}
                />
                <Pressable style={[styles.genBtn, (genBusy || exhausted) && styles.disabled]} onPress={generateMusic} disabled={genBusy || exhausted || readOnly}>
                    {genBusy ? <ActivityIndicator size="small" color="#fff" /> : <FontAwesomeIcon icon={faWandMagicSparkles} size={13} color="#fff" />}
                </Pressable>
            </View>

            {/* Mix controls (when a bed is selected) */}
            {audio?.musicUrl ? (
                <View style={styles.mix}>
                    <VolumeBar
                        colors={colors}
                        label="Music"
                        value={audio.musicVolume ?? 0.7}
                        onChange={(v) => patch({ musicVolume: v })}
                    />
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Fade in/out</Text>
                        <Switch value={!!audio.musicFade} onValueChange={(v) => patch({ musicFade: v })} disabled={readOnly} />
                    </View>
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Duck under voiceover</Text>
                        <Switch value={audio.duckMusic ?? true} onValueChange={(v) => patch({ duckMusic: v })} disabled={readOnly} />
                    </View>
                </View>
            ) : null}

            {/* ── Voiceover ── */}
            <View style={styles.voHeader}>
                <FontAwesomeIcon icon={faMicrophone} size={14} color={colors.text} />
                <Text style={styles.voTitle}>Voiceover</Text>
                <Text style={styles.voHint}>reads your script</Text>
            </View>
            <View style={styles.chips}>
                {voices.map((v) => {
                    const sel = selectedVoiceId === v.voice_id;
                    return (
                        <Pressable key={v.voice_id} onPress={() => patch({ voiceoverId: v.voice_id })} style={[styles.voiceChip, sel && styles.chipActive]}>
                            <Pressable onPress={() => v.preview_url && audition.toggle(v.preview_url)} hitSlop={6}>
                                <FontAwesomeIcon icon={audition.playingUrl === v.preview_url ? faPause : faPlay} size={11} color={sel ? colors.primary : colors.text} />
                            </Pressable>
                            <Text style={[styles.chipText, sel && styles.chipTextActive]}>{v.name}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <View style={styles.genRow}>
                <View style={styles.scriptPreview}>
                    <Text style={styles.scriptText} numberOfLines={1}>
                        {voiceoverSource.trim() ? `"${voiceoverSource.trim()}"` : "Add a script or caption to voice over"}
                    </Text>
                </View>
                <Pressable style={[styles.voGenBtn, (voiceBusy || exhausted) && styles.disabled]} onPress={generateVoice} disabled={voiceBusy || exhausted || readOnly}>
                    {voiceBusy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.voGenText}>Generate voice</Text>}
                </Pressable>
            </View>
            {audio?.voiceoverUrl ? (
                <View style={styles.mix}>
                    <View style={styles.row}>
                        <PlayBtn url={audio.voiceoverUrl} />
                        <Text style={styles.rowTitle}>Voiceover added</Text>
                    </View>
                    <VolumeBar colors={colors} label="Voice" value={audio.voiceoverVolume ?? 1} onChange={(v) => patch({ voiceoverVolume: v })} />
                </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
};

// Tap-to-set volume bar (no drag / no slider dependency).
const VolumeBar: React.FC<{ colors: any; label: string; value: number; onChange: (v: number) => void }> = ({
    colors,
    label,
    value,
    onChange,
}) => {
    const [w, setW] = useState(1);
    const styles = useStyles(colors);
    return (
        <View style={styles.volRow}>
            <Text style={styles.volLabel}>{label}</Text>
            <Pressable
                style={styles.volTrack}
                onLayout={(e) => setW(e.nativeEvent.layout.width)}
                onPress={(e) => onChange(Math.max(0, Math.min(e.nativeEvent.locationX / Math.max(w, 1), 1)))}
            >
                <View style={[styles.volFill, { width: `${Math.round(value * 100)}%` }]} />
            </Pressable>
            <Text style={styles.volPct}>{Math.round(value * 100)}%</Text>
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
                searchRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    height: 38,
                },
                search: { flex: 1, color: colors.text, fontSize: 13 },
                chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
                chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: colors.tag },
                chipActive: { backgroundColor: colors.primary },
                chipText: { fontSize: 12, color: colors.text, textTransform: "capitalize" },
                chipTextActive: { color: "#fff" },
                voiceChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: colors.tag },
                loader: { paddingVertical: 10 },
                list: { gap: 4 },
                empty: { fontSize: 12, color: colors.textSecondary, paddingVertical: 8 },
                sectionLabel: { fontSize: 12, fontWeight: "500", color: colors.textSecondary, marginTop: 2 },
                row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10 },
                rowSelected: { backgroundColor: colors.tag },
                rowMeta: { flex: 1 },
                rowTitle: { fontSize: 13, fontWeight: "500", color: colors.text },
                rowSub: { fontSize: 11, color: colors.textSecondary },
                added: { fontSize: 12, color: colors.primary, fontWeight: "500" },
                useBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.tag },
                useBtnText: { fontSize: 12, color: colors.text },
                playBtn: {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                genRow: { flexDirection: "row", alignItems: "center", gap: 8 },
                genInput: {
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    color: colors.text,
                    backgroundColor: colors.tag,
                    fontSize: 13,
                },
                genBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
                disabled: { opacity: 0.5 },
                mix: { gap: 8, backgroundColor: colors.tag, borderRadius: 10, padding: 10 },
                toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                toggleLabel: { fontSize: 13, color: colors.text },
                voHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
                voTitle: { fontSize: 14, fontWeight: "600", color: colors.text, flex: 1 },
                voHint: { fontSize: 11, color: colors.textSecondary },
                scriptPreview: { flex: 1, backgroundColor: colors.tag, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
                scriptText: { fontSize: 12, color: colors.textSecondary },
                voGenBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: colors.primary },
                voGenText: { fontSize: 12, color: "#fff", fontWeight: "500" },
                volRow: { flexDirection: "row", alignItems: "center", gap: 10 },
                volLabel: { fontSize: 12, color: colors.textSecondary, width: 44 },
                volTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.card, overflow: "hidden" },
                volFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
                volPct: { fontSize: 11, color: colors.textSecondary, width: 34, textAlign: "right" },
                error: { fontSize: 12, color: colors.error },
            }),
        [colors]
    );

export default SoundtrackPanel;
