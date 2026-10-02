import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fs, lh } from "@/constants/Typography";
import { track } from "@/shared-libs/utils/analytics";

// Entitlement gates — capability locks (NOT consumption). Two presentations:
//   • UpgradeInline  — a compact in-context upsell row (Inbox view-only, posting cap).
//   • LockedOverlay  — shows the feature dimmed behind an "unlock" card so the
//                      user sees the value first (Analytics on free).
// Pre-empt, don't punish: gate before the action, keep the user in context.

function goToBilling() {
    router.push("/billing");
}

/**
 * Reports that a user hit a capability lock. Fired once per mount rather than
 * per render, so a re-rendering screen doesn't inflate the count.
 *
 * `feature` is optional: these two components are presentational and are also
 * used in places where the blocked capability has no single name. Callers that
 * pass it get the event; callers that don't are unaffected.
 */
function useBlockedEvent(feature?: string, reason: string = "plan_locked") {
    const reported = useRef(false);
    useEffect(() => {
        if (!feature || reported.current) return;
        reported.current = true;
        track("entitlement_blocked", { reason, feature });
    }, [feature, reason]);
}

export const UpgradeInline: React.FC<{
    message: string;
    ctaLabel?: string;
    onPress?: () => void;
    /** Capability being gated, e.g. "inbox_reply". Enables the analytics event. */
    feature?: string;
    /** Backend gate reason, e.g. "tokens_exhausted". Defaults to a plan lock. */
    reason?: string;
}> = ({ message, ctaLabel = "Upgrade", onPress, feature, reason }) => {
    useBlockedEvent(feature, reason);
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    return (
        <View style={styles.inlineWrap}>
            <View style={styles.inlineAccent} />
            <FontAwesomeIcon icon={faLock} size={12} color={colors.primary} />
            <Text style={styles.inlineText} numberOfLines={2}>{message}</Text>
            <Pressable
                onPress={onPress ?? goToBilling}
                style={({ pressed }) => [styles.inlineCta, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={ctaLabel}
                hitSlop={6}
            >
                <Text style={styles.inlineCtaText}>{ctaLabel}</Text>
            </Pressable>
        </View>
    );
};

export const LockedOverlay: React.FC<{
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    children: React.ReactNode;
    /** Capability being gated, e.g. "analytics". Enables the analytics event. */
    feature?: string;
    /** Backend gate reason, e.g. "tokens_exhausted". Defaults to a plan lock. */
    reason?: string;
}> = ({ title, subtitle, ctaLabel = "Upgrade to unlock", children, feature, reason }) => {
    useBlockedEvent(feature, reason);
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    return (
        <View style={styles.overlayRoot}>
            <View
                style={styles.overlayDimmed}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                {children}
            </View>
            <View style={styles.overlayScrim} pointerEvents="box-none">
                <View style={[styles.overlayCard, { maxWidth: xl ? 420 : 320 }]}>
                    <View style={styles.overlayIcon}>
                        <FontAwesomeIcon icon={faLock} size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.overlayTitle}>{title}</Text>
                    {subtitle ? <Text style={styles.overlaySubtitle}>{subtitle}</Text> : null}
                    <Pressable
                        onPress={goToBilling}
                        style={({ pressed }) => [styles.overlayCta, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={ctaLabel}
                    >
                        <Text style={styles.overlayCtaText}>{ctaLabel}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                pressed: { opacity: 0.75 },
                // ── Inline upsell ──
                inlineWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                    paddingRight: 10,
                    paddingVertical: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.06,
                    elevation: 1,
                },
                inlineAccent: { width: 4, alignSelf: "stretch", backgroundColor: colors.primary },
                inlineText: { flex: 1, fontSize: fs(12.5), color: colors.text, lineHeight: lh(17), paddingLeft: 2 },
                inlineCta: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
                inlineCtaText: { fontSize: fs(13), fontWeight: "700", color: colors.primary },
                // ── Locked overlay ──
                overlayRoot: { flex: 1 },
                overlayDimmed: { flex: 1, opacity: 0.25 },
                overlayScrim: {
                    ...StyleSheet.absoluteFillObject,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                overlayCard: {
                    width: "100%",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 18,
                    backgroundColor: colors.card,
                    paddingVertical: 24,
                    paddingHorizontal: 24,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 0.18,
                    elevation: 10,
                },
                overlayIcon: {
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                overlayTitle: { fontSize: fs(17), fontWeight: "800", color: colors.text, textAlign: "center" },
                overlaySubtitle: { fontSize: fs(13), color: colors.textSecondary, textAlign: "center", lineHeight: lh(19) },
                overlayCta: {
                    marginTop: 6,
                    minHeight: 44,
                    justifyContent: "center",
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                overlayCtaText: { fontSize: fs(14), fontWeight: "700", color: colors.onPrimary },
            }),
        [colors]
    );
}
