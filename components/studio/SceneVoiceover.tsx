/**
 * SceneVoiceover — generate the line this scene speaks.
 *
 * ── The gate, on both sides ─────────────────────────────────────────────────
 * This is the first thing in the studio that spends money, and the standing
 * rule is that a gate is not done when only the backend 402s. So all three
 * states are here:
 *
 *   healthy          → the button
 *   low / critical   → the button, plus a notice saying what is left
 *   exhausted        → the button is REPLACED by the exhausted block
 *
 * Pre-empt, don't punish. There is no redirect: the scene stays, the rail
 * stays, and the upgrade path appears where the action was. A user who is out
 * of tokens should not lose the thing they were editing to find out.
 *
 * The backend still refuses with `reason: "tokens_exhausted"` regardless, which
 * is what makes this layer an improvement in experience rather than the only
 * thing standing between a free plan and a bill.
 */
import { fs, lh } from "@/constants/Typography";
import { TokenMeterBlock, TokenMeterNotice } from "@/components/billing/TokenMeter";
import { useEntitlements } from "@/hooks/use-entitlements";
import { ISceneNarration } from "@/shared-libs/firestore/trendly-pro/models/studio";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export interface SceneVoiceoverProps {
    brandId: string;
    /** The document's one voice. Two voices in a 30s reel read as two videos. */
    voiceId?: string;
    narration?: ISceneNarration;
    busy?: boolean;
    /** Called with the generated audio's media id. */
    onGenerated: (mediaId: string, url: string, durationMs: number) => void;
}

const SceneVoiceover: React.FC<SceneVoiceoverProps> = ({
    brandId,
    voiceId,
    narration,
    busy,
    onGenerated,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { tokens } = useEntitlements();

    const [working, setWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const line = narration?.line?.trim() ?? "";
    const already = !!narration?.mediaId;

    const generate = async () => {
        if (!line || !voiceId) return;
        setWorking(true);
        setError(null);
        try {
            const res = await HttpWrapper.fetch(`/api/media/brands/${brandId}/audio/voiceover`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: line, voiceId }),
            });
            const json = (await res.json()) as {
                id?: string;
                url?: string;
                durationMs?: number;
                mediaId?: string;
            };
            if (!json.url) throw new Error("no audio");
            onGenerated(json.mediaId || json.id || "", json.url, json.durationMs ?? 0);
        } catch (e: unknown) {
            // A 402 arrives here as an HttpError. The copy stays about tokens
            // rather than about a failure, because the user has not done
            // anything wrong.
            const status = (e as { status?: number })?.status;
            setError(
                status === 402
                    ? "You're out of AI tokens for this period."
                    : "That voiceover didn't come back. Please try again."
            );
        } finally {
            setWorking(false);
        }
    };

    // Exhausted REPLACES the action. The scene and the rail are untouched.
    if (tokens.state === "exhausted") {
        return (
            <View style={styles.wrap}>
                <TokenMeterBlock tokens={tokens} />
            </View>
        );
    }

    if (!voiceId) {
        return (
            <View style={styles.wrap}>
                <Text style={styles.note}>
                    Pick a voice for this video first — one voice for the whole thing, so it does
                    not read as two videos spliced together.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            {tokens.state === "low" || tokens.state === "critical" ? (
                <TokenMeterNotice tokens={tokens} />
            ) : null}

            <Pressable
                style={[styles.btn, (!line || working || busy) && styles.btnOff]}
                onPress={generate}
                disabled={!line || working || busy}
            >
                {working ? (
                    <ActivityIndicator color={colors.white} size="small" />
                ) : (
                    <Text style={styles.btnText}>
                        {already ? "Say it again" : "Generate the voiceover"}
                    </Text>
                )}
            </Pressable>

            {!line ? <Text style={styles.note}>Write the line first.</Text> : null}
            {already ? (
                <Text style={styles.note}>
                    Already recorded. Regenerating replaces it and costs tokens again.
                </Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                wrap: { gap: 8 },
                btn: {
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
                btnOff: { opacity: 0.45 },
                btnText: {
                    color: colors.white,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
                note: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(16) },
                error: { color: colors.red, fontSize: fs(11), lineHeight: lh(16) },
            }),
        [colors]
    );

export default SceneVoiceover;
