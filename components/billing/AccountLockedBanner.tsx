import { useEntitlements } from "@/hooks/use-entitlements";
import Colors from "@/shared-uis/constants/Colors";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Persistent, app-wide banner shown when the org's subscription is locked /
// past-due / canceled — a payment problem, distinct from a usage limit, so an
// assertive interrupt is warranted. Renders nothing when the org is healthy.
const AccountLockedBanner: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { isOrgLocked, billing } = useEntitlements();

    if (!isOrgLocked) return null;

    const state = billing?.accessState;
    const msg =
        state === "past_due"
            ? "Your payment is overdue — update billing to avoid losing access."
            : state === "canceled"
                ? "Your subscription was canceled. Reactivate to restore your plan."
                : "Your subscription is locked — a payment failed. Update billing to restore access.";

    return (
        <View style={styles.wrap}>
            <FontAwesomeIcon icon={faTriangleExclamation} size={13} color={colors.white} />
            <Text style={styles.text} numberOfLines={2}>{msg}</Text>
            <Pressable
                onPress={() => router.push("/billing")}
                style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Fix billing"
                hitSlop={6}
            >
                <Text style={styles.ctaText}>Fix billing</Text>
            </Pressable>
        </View>
    );
};

export default AccountLockedBanner;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                pressed: { opacity: 0.8 },
                wrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: colors.red,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.12,
                    elevation: 3,
                    zIndex: 10,
                },
                text: { flex: 1, fontSize: 12.5, fontWeight: "600", color: colors.white, lineHeight: 17 },
                cta: {
                    minHeight: 36,
                    justifyContent: "center",
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: colors.white,
                },
                ctaText: { fontSize: 12.5, fontWeight: "800", color: colors.red },
            }),
        [colors]
    );
}
