import { NUDGE_COPY, NudgeTriggerKey } from "@/constants/SubscribeNudge";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { track } from "@/shared-libs/utils/analytics";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { getOfferings, isIapConfigured, purchase } from "@/utils/iap/purchases";
import { IapPackage } from "@/utils/iap/types";
import { faBolt, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { goToBilling } from "@/utils/billing-navigation";
import {
    ActivityIndicator,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { PRIVACY_URL, TERMS_URL } from "@/constants/App";
import { fs, lh } from "@/constants/Typography";

// The proactive subscribe nudge (Notion: "Prompting to Subscribe to In-app
// Purchase"). Benefits-led, with the dismiss deliberately de-emphasized: a
// small "X" and tap-outside, with no prominent "continue free" button.
//
// A real dismiss path is kept on BOTH platforms on purpose — App Store review
// (3.1.1-adjacent) and FTC/EU dark-pattern rules both require the user can
// actually decline. De-emphasized is the goal; inescapable is not.
//
// Purchase target is platform-specific: native runs the RevenueCat flow
// in-sheet; web routes to the Razorpay-backed billing screen.

// Kept honest: AI is metered on every plan, so the paid promise is a bigger
// allowance, not an unlimited one. "Unlimited" here used to be flatly untrue
// against a wallet the same app shows draining.
const BENEFITS = [
    "10× the monthly AI tokens",
    "Full analytics & audience insights",
    "Unlimited scheduling, more brands & seats",
];

interface Props {
    trigger: NudgeTriggerKey;
    onDismiss: () => void;
    onConverted: () => void;
}

const SubscribeNudgeSheet: React.FC<Props> = ({ trigger, onDismiss, onConverted }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);

    const copy = NUDGE_COPY[trigger];
    const [proPackage, setProPackage] = useState<IapPackage | null>(null);
    const [busy, setBusy] = useState(false);

    const isNativeIap = Platform.OS !== "web" && isIapConfigured();

    // Preload the recommended (Pro) package so the CTA can purchase in one tap
    // rather than bouncing the user to the full paywall.
    useEffect(() => {
        if (!isNativeIap) return;
        let cancelled = false;
        getOfferings().then((o) => {
            if (cancelled) return;
            const pro = o.subscriptions.find((p) => p.planKey === "pro") ?? o.subscriptions[0] ?? null;
            setProPackage(pro);
        });
        return () => {
            cancelled = true;
        };
    }, [isNativeIap]);

    const handleUpgrade = useCallback(async () => {
        // Web (and native without configured store products) → billing screen,
        // which owns the Razorpay checkout / plan comparison.
        if (!isNativeIap || !proPackage) {
            onConverted();
            goToBilling("subscribe_nudge", { reason: trigger });
            return;
        }
        setBusy(true);
        track("checkout_started", {
            plan_key: proPackage.planKey ?? proPackage.productId,
            provider: "iap",
        });
        const res = await purchase(proPackage);
        setBusy(false);
        if (res.userCancelled) return;
        if (res.success) {
            // subscription_started comes from SubscriptionTransitionWatcher —
            // see the note in components/paywall/index.native.tsx.
            Toaster.success("Purchase successful — unlocking your plan. This can take a minute.");
            onConverted();
        } else {
            Toaster.error(res.error ?? "Purchase failed. Please try again.");
        }
    }, [isNativeIap, proPackage, onConverted]);

    const ctaLabel = useMemo(() => {
        if (busy) return "";
        if (isNativeIap && proPackage) return `Upgrade — ${proPackage.priceString}/mo`;
        return "Upgrade Now";
    }, [busy, isNativeIap, proPackage]);

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
            <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityLabel="Dismiss">
                {/* Inner press must not bubble to the backdrop's dismiss. */}
                <Pressable style={styles.card} onPress={() => { }}>
                    <Pressable
                        style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                        onPress={onDismiss}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        hitSlop={12}
                    >
                        <FontAwesomeIcon icon={faXmark} size={14} color={colors.textSecondary} />
                    </Pressable>

                    <View style={styles.iconBadge}>
                        <FontAwesomeIcon icon={faBolt} size={20} color={colors.primary} />
                    </View>

                    <Text style={styles.headline}>{copy.headline}</Text>
                    <Text style={styles.body}>{copy.body}</Text>

                    <View style={styles.benefits}>
                        {BENEFITS.map((b) => (
                            <View key={b} style={styles.benefitRow}>
                                <FontAwesomeIcon icon={faCheck} size={12} color={colors.primary} />
                                <Text style={styles.benefitText}>{b}</Text>
                            </View>
                        ))}
                    </View>

                    <Pressable
                        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
                        onPress={handleUpgrade}
                        disabled={busy}
                        accessibilityRole="button"
                        accessibilityLabel="Upgrade your plan"
                    >
                        {busy ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <Text style={styles.ctaText}>{ctaLabel}</Text>
                        )}
                    </Pressable>

                    {/* When this sheet is itself the purchase screen (native IAP),
                        it carries the same guideline-3.1.2 disclosure the full
                        paywall does — renewal terms plus functional Terms/Privacy
                        links. On web the CTA only routes to the billing screen, so
                        the disclosure belongs there, not here. */}
                    {isNativeIap && proPackage ? (
                        <View style={styles.legalWrap}>
                            <Text style={styles.legalText}>
                                Renews automatically each month until cancelled. Cancel anytime in
                                your {Platform.OS === "ios" ? "App Store" : "Google Play"} account settings.
                            </Text>
                            <View style={styles.legalLinks}>
                                <Pressable
                                    onPress={() => Linking.openURL(TERMS_URL)}
                                    accessibilityRole="link"
                                    accessibilityLabel="Terms of Use"
                                    hitSlop={10}
                                    style={({ pressed }) => [styles.legalLinkHit, pressed && styles.pressed]}
                                >
                                    <Text style={styles.legalLink}>Terms of Use</Text>
                                </Pressable>
                                <Text style={styles.legalSep}>·</Text>
                                <Pressable
                                    onPress={() => Linking.openURL(PRIVACY_URL)}
                                    accessibilityRole="link"
                                    accessibilityLabel="Privacy Policy"
                                    hitSlop={10}
                                    style={({ pressed }) => [styles.legalLinkHit, pressed && styles.pressed]}
                                >
                                    <Text style={styles.legalLink}>Privacy Policy</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : null}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                pressed: { opacity: 0.75 },
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    alignItems: "center",
                    justifyContent: xl ? "center" : "flex-end",
                    padding: xl ? 24 : 0,
                },
                card: {
                    width: "100%",
                    maxWidth: xl ? 420 : undefined,
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: colors.card,
                    borderRadius: xl ? 20 : 0,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingTop: 28,
                    paddingBottom: xl ? 28 : 36,
                    paddingHorizontal: 24,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowRadius: 24,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                closeBtn: {
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 14,
                },
                iconBadge: {
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                    marginBottom: 4,
                },
                headline: {
                    fontSize: fs(19),
                    fontWeight: "800",
                    color: colors.text,
                    textAlign: "center",
                },
                body: {
                    fontSize: fs(13.5),
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: lh(20),
                },
                benefits: {
                    alignSelf: "stretch",
                    gap: 10,
                    marginTop: 14,
                    marginBottom: 6,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: colors.tag,
                },
                benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
                benefitText: { flex: 1, fontSize: fs(13), color: colors.text },
                cta: {
                    alignSelf: "stretch",
                    minHeight: 50,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 8,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                ctaText: { fontSize: fs(15), fontWeight: "700", color: colors.white },

                legalWrap: { marginTop: 14, gap: 6, alignItems: "center" },
                legalText: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    color: colors.textSecondary,
                    textAlign: "center",
                },
                legalLinks: { flexDirection: "row", alignItems: "center", gap: 8 },
                // Padded so a line of fine print is still a comfortable tap target.
                legalLinkHit: { paddingVertical: 8, paddingHorizontal: 4 },
                legalLink: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: colors.primary,
                },
                legalSep: { fontSize: fs(11), color: colors.textSecondary },
            }),
        [colors, xl]
    );
}

export default SubscribeNudgeSheet;
