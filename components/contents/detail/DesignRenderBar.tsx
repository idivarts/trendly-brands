import Colors from "@/shared-uis/constants/Colors";
import { fs, lh } from "@/constants/Typography";
import {
    faCircleCheck,
    faCircleExclamation,
    faRotate,
    faTriangleExclamation,
    faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { RenderError } from "./design-stage/use-design-render";

// ─── DesignRenderBar ──────────────────────────────────────────────────────────
// Says whether a design has been turned into a publishable asset, and offers the
// one action that does it.
//
// A design is HTML until someone renders it, and Render used to live only in the
// Design Studio header — two screens from where the user judges whether the post
// is ready. Meanwhile the Media Stage showed a full-fidelity canvas captioned
// "6 slides", which reads as finished. Three genuinely different states all
// looked identical:
//
//   never   — no attachments. Not publishable at all.
//   stale   — attachments exist, but from an EARLIER revision. Publishing would
//             silently ship a version that doesn't match what's on screen. This
//             is the dangerous one: it looks completely fine.
//   current — the revision on screen is the one that was rendered.
//
// The state is read off the revision's own `renderUrl` (see use-design-preview),
// so no extra bookkeeping is needed.

export type DesignRenderState = "never" | "stale" | "current";

export interface DesignRenderBarProps {
    state: DesignRenderState;
    /** "Render video" / "Render 6 slides" / "Render image". */
    label: string;
    capturing: boolean;
    /** 0..1 while frames are captured; null while indeterminate. */
    progress: number | null;
    error: RenderError | null;
    onRender: () => void;
    onDismissError: () => void;
    /** Hidden entirely when the content is locked (scheduled / posted). */
    readOnly?: boolean;
}

const DesignRenderBar: React.FC<DesignRenderBarProps> = ({
    state,
    label,
    capturing,
    progress,
    error,
    onRender,
    onDismissError,
    readOnly = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // Already current and nothing to report — the bar would be pure noise.
    if (state === "current" && !capturing && !error) return null;
    if (readOnly) return null;

    const pct = progress != null ? Math.round(progress * 100) : null;

    if (capturing) {
        return (
            <View style={styles.wrap}>
                <View style={styles.progressRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.progressText}>
                        {pct != null ? `Rendering… ${pct}%` : "Preparing…"}
                    </Text>
                </View>
                {pct != null ? (
                    <View style={styles.track}>
                        <View style={[styles.trackFill, { width: `${pct}%` }]} />
                    </View>
                ) : null}
                <Text style={styles.progressHint}>
                    Keep this tab open — the render happens on your device.
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.wrap}>
                <View style={styles.errorRow}>
                    <FontAwesomeIcon
                        icon={faCircleExclamation}
                        size={13}
                        color={colors.errorBannerText}
                    />
                    <Text style={styles.errorText}>{error.message}</Text>
                </View>
                <View style={styles.errorActions}>
                    {error.retry ? (
                        <Pressable
                            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                            onPress={onRender}
                            accessibilityRole="button"
                            accessibilityLabel="Try rendering again"
                        >
                            <FontAwesomeIcon icon={faRotate} size={13} color={colors.onPrimary} />
                            <Text style={styles.primaryBtnText}>Try again</Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                        onPress={onDismissError}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss"
                    >
                        <Text style={styles.ghostBtnText}>Dismiss</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    const stale = state === "stale";

    return (
        <View style={[styles.wrap, stale && styles.wrapStale]}>
            <View style={styles.statusRow}>
                <FontAwesomeIcon
                    icon={stale ? faTriangleExclamation : faCircleExclamation}
                    size={13}
                    color={stale ? colors.errorBannerText : colors.primary}
                />
                <Text style={[styles.statusText, stale && styles.statusTextStale]}>
                    {stale
                        ? "Edited since you last rendered — publishing would use the old version."
                        : "This design isn't a post yet. Render it to publish."}
                </Text>
            </View>

            <Pressable
                style={({ pressed }) => [styles.primaryBtn, styles.primaryBtnWide, pressed && styles.pressed]}
                onPress={onRender}
                accessibilityRole="button"
                accessibilityLabel={stale ? `Re-render. ${label}` : label}
            >
                <FontAwesomeIcon
                    icon={stale ? faRotate : faWandMagicSparkles}
                    size={14}
                    color={colors.onPrimary}
                />
                <Text style={styles.primaryBtnText}>
                    {stale ? label.replace(/^Render/, "Re-render") : label}
                </Text>
            </Pressable>
        </View>
    );
};

/** The quiet "✓ Rendered" / "Not rendered" pill for the stage header. */
export const DesignRenderChip: React.FC<{ state: DesignRenderState }> = ({ state }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const map = {
        never: { text: "Not rendered", warn: true },
        stale: { text: "Out of date", warn: true },
        current: { text: "Rendered", warn: false },
    } as const;
    const { text, warn } = map[state];

    return (
        <View style={[styles.chip, warn ? styles.chipWarn : styles.chipOk]}>
            <FontAwesomeIcon
                icon={warn ? faTriangleExclamation : faCircleCheck}
                size={9}
                color={warn ? colors.errorBannerText : colors.primary}
            />
            <Text style={[styles.chipText, warn && styles.chipTextWarn]}>{text}</Text>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrap: {
            borderRadius: 12,
            padding: 12,
            gap: 10,
            backgroundColor: colors.aliceBlue,
        },
        wrapStale: {
            backgroundColor: colors.errorBannerBg,
        },
        statusRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
        },
        statusText: {
            flex: 1,
            fontSize: fs(12),
            fontWeight: "600",
            color: colors.textSecondary,
            lineHeight: lh(17),
        },
        statusTextStale: {
            color: colors.errorBannerText,
        },
        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 46,
            paddingHorizontal: 16,
            borderRadius: 11,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        primaryBtnWide: {
            alignSelf: "stretch",
        },
        primaryBtnText: {
            fontSize: fs(14),
            fontWeight: "700",
            color: colors.onPrimary,
        },
        ghostBtn: {
            minHeight: 46,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 14,
        },
        ghostBtnText: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        progressRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
        },
        progressText: {
            fontSize: fs(13),
            fontWeight: "700",
            color: colors.text,
        },
        progressHint: {
            fontSize: fs(11),
            color: colors.textSecondary,
        },
        track: {
            height: 5,
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: colors.tag,
        },
        trackFill: {
            height: "100%",
            borderRadius: 3,
            backgroundColor: colors.primary,
        },
        errorRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
        },
        errorText: {
            flex: 1,
            fontSize: fs(12),
            fontWeight: "600",
            color: colors.errorBannerText,
            lineHeight: lh(17),
        },
        errorActions: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        chip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: 7,
        },
        chipOk: {
            backgroundColor: colors.aliceBlue,
        },
        chipWarn: {
            backgroundColor: colors.errorBannerBg,
        },
        chipText: {
            fontSize: fs(11),
            fontWeight: "700",
            letterSpacing: 0.3,
            color: colors.primary,
        },
        chipTextWarn: {
            color: colors.errorBannerText,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default DesignRenderBar;
