import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Entitlement gates — capability locks (NOT consumption). Two presentations:
//   • UpgradeInline  — a compact in-context upsell row (Inbox view-only, posting cap).
//   • LockedOverlay  — shows the feature dimmed behind an "unlock" card so the
//                      user sees the value first (Analytics on free).
// Pre-empt, don't punish: gate before the action, keep the user in context.

function goToBilling() {
    router.push("/billing");
}

export const UpgradeInline: React.FC<{
    message: string;
    ctaLabel?: string;
    onPress?: () => void;
}> = ({ message, ctaLabel = "Upgrade", onPress }) => {
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
}> = ({ title, subtitle, ctaLabel = "Upgrade to unlock", children }) => {
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
                inlineText: { flex: 1, fontSize: 12.5, color: colors.text, lineHeight: 17, paddingLeft: 2 },
                inlineCta: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
                inlineCtaText: { fontSize: 13, fontWeight: "700", color: colors.primary },
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
                overlayTitle: { fontSize: 17, fontWeight: "800", color: colors.text, textAlign: "center" },
                overlaySubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 19 },
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
                overlayCtaText: { fontSize: 14, fontWeight: "700", color: colors.onPrimary },
            }),
        [colors]
    );
}
