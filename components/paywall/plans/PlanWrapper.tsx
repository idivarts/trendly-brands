//  import pricingPage from "@/app/(landing)/pricing-page";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useOrganizationContext } from "@/contexts/organization-context.provider";
import { useBreakpoints } from "@/hooks";
import { ModelStatus } from "@/shared-libs/firestore/trendly-pro/models/status";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { CreateCustomLinkModal, IAdminData } from "../CustomPlanModal";

export type PlanKey = 'free' | 'pro' | 'team' | 'agency'
export type BillingCycle = "yearly" | "monthly";

/* ----------------------- Config ----------------------- */
// New USD, org-level, monthly-only plans (see the Credit System ticket). Value
// metric = brand workspaces per org; everything metered draws from one monthly
// token wallet.
const freeFeatures = [
    "1 brand workspace",
    "1 seat",
    "20 tokens / month",
    "10 creator lookups / month",
    "Basic scheduling & analytics",
]

const proFeatures = [
    "1 brand workspace",
    "2 seats",
    "200 tokens / month",
    "Creator lookups from your token balance",
    "Full scheduling · standard analytics",
]

const teamFeatures = [
    "Up to 3 brand workspaces",
    "5 seats",
    "600 tokens / month",
    "Approvals & campaigns",
    "Full analytics + team reporting",
]

const agencyFeatures = [
    "Custom brand workspaces",
    "Custom seats",
    "Custom monthly token allowance",
    "Unlimited creator lookups",
    "Priority support & onboarding",
]
const PLANS: { key: PlanKey, name: string, monthly: number, features: string[], preferred: boolean, custom?: boolean }[] = [
    {
        key: "free",
        name: "Free",
        monthly: 0,
        features: freeFeatures,
        preferred: false
    },
    {
        key: "pro",
        name: "Pro",
        monthly: 29,
        features: proFeatures,
        preferred: false
    },
    {
        key: "team",
        name: "Team",
        monthly: 79,
        features: teamFeatures,
        preferred: true
    },
    {
        key: "agency",
        name: "Agency",
        monthly: 0,
        features: agencyFeatures,
        preferred: false,
        custom: true
    },
] as const;

interface PlanWrapperProps {
    verticallyStacked?: boolean;
    onSelect?: (planKey: typeof PLANS[number]["key"], billing: BillingCycle) => void;
}

const PlanWrapper = (props: PlanWrapperProps) => {
    const theme = useTheme();
    const { xl } = useBreakpoints();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Monthly-only billing (no annual plans in v1 — see the Credit System ticket).
    const [billing, setBilling] = React.useState<BillingCycle>("monthly");

    const [modalVisible, setModalVisible] = useState(false);
    const [modalState, setModalState] = useState<"loading" | "ready" | "opened" | "error" | "admin">("loading");
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [customModalVisible, setCustomModalVisible] = useState(false);
    const [customPlanKey, setCustomPlanKey] = useState<PlanKey | null>(null);
    const [adminData, setAdminData] = useState<IAdminData & { userExists: boolean } | null>(null)

    const { openModal } = useConfirmationModel()
    const router = useMyNavigation()
    const { manager } = useAuthContext()

    const handleSubmit = async (planKey: typeof PLANS[number]["key"], adminData?: IAdminData) => {
        try {
            if (planKey == "agency" && !manager?.isAdmin) {
                openModal({
                    title: "Upgrade to Agency",
                    description: "Agency plans are tailored to your needs with custom pricing. Contact support and we'll set you up.",
                    confirmText: "Contact Support",
                    confirmAction: () => {
                        Linking.openURL("mailto:support@idiv.in")
                    }
                })
                return;
            } else if (planKey == "free") {
                router.resetAndNavigate("/discover")
                return
            }

            if (manager?.isAdmin && !adminData) {
                Toaster.error("Admin Data not provided for the subscription")
                return
            }

            setModalVisible(true);
            setModalState("loading");
            setPaymentUrl(null);
            // Placeholder API call; you will replace this later
            const res = await HttpWrapper.fetch(`/razorpay/subscriptions/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brandId: selectedBrand?.id,
                    planKey,
                    planCycle: billing,
                    adminData
                }),
            });
            if (!res.ok) throw new Error("Failed to create payment link");
            const data = await res.json();
            const url: string | undefined = data?.link;
            const userExists: boolean = data?.userExists;
            if (!url) throw new Error("No payment URL in response");
            setPaymentUrl(url);
            if (adminData) {
                setAdminData({
                    ...adminData,
                    userExists
                })
                setModalState("admin");
            } else {
                setModalState("ready");
            }
        } catch (e) {
            setModalState("error");
        }
    };

    const vStacked = xl ? props.verticallyStacked : true;

    const SORTED_FILTER = useMemo(() => {
        if (!vStacked) return PLANS;
        return [...PLANS].sort((a, b) => {
            if (a.preferred && !b.preferred) return -1;
            if (!a.preferred && b.preferred) return 1;
            return b.monthly - a.monthly;
        });
    }, [vStacked]);

    const { selectedBrand } = useBrandContext();
    const { selectedOrgBilling } = useOrganizationContext();

    useEffect(() => {
        // Monthly-only — always present plans on the monthly cadence.
        setBilling("monthly");
    }, [selectedBrand?.id, selectedOrgBilling?.planCycle])

    // Default a missing planKey to "free" — legacy orgs (and freshly
    // auto-provisioned ones) may have no billing record yet. Mirrors
    // organization-context's isOnFreeTrial rule (!planKey || planKey === "free").
    const currentPlanKey = (selectedOrgBilling?.planKey as PlanKey) || "free"
    const currentPlanCycle = selectedOrgBilling?.planCycle as BillingCycle | undefined;

    const openPaymentLink = async () => {
        if (!paymentUrl) return;
        try {
            setModalState("opened");
            const canOpen = await Linking.canOpenURL(paymentUrl);
            if (canOpen) await Linking.openURL(paymentUrl);
            else if (typeof window !== "undefined") (window as any).open(paymentUrl, "_blank");
        } catch { }
    };

    // --- Copy text helper and formatted message for admin modal ---
    const copyText = async (text: string) => {
        try {
            // Web first
            if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
                await (navigator as any).clipboard.writeText(text);
            } else if (Platform.OS !== 'web') {
                // // Lazy-load expo-clipboard on native if available
                // try {
                //     const mod: any = await import('expo-clipboard');
                //     if (mod?.setStringAsync) await mod.setStringAsync(text);
                // } catch { }
            }
            Toaster.success('Copied');
        } catch {
            Toaster.error('Failed to copy');
        }
    };

    const formattedAdminMessage = React.useMemo(() => {
        if (!paymentUrl || !adminData) return '';
        const loginUrl = 'https://brands.trendly.now/login';
        if (adminData.userExists) {
            return [
                'Subject: Trendly subscription link',
                '',
                'Hi,',
                '',
                `Payment link: ${paymentUrl}`,
                `Registered email: ${adminData.email}`,
                'Your account already exists on Trendly. Use your existing password or reset it from the login page.',
                `Login: ${loginUrl}`,
                '',
                'Thanks,',
                'Trendly Support'
            ].join('\n');
        }
        return [
            'Subject: Trendly subscription link',
            '',
            'Hi,',
            '',
            `Payment link: ${paymentUrl}`,
            `Email: ${adminData.email}`,
            `Temporary password: ${adminData.password}`,
            `Login: ${loginUrl}`,
            '',
            'You can change the password after signing in.',
            '',
            'Thanks,',
            'Trendly Support'
        ].join('\n');
    }, [paymentUrl, adminData]);

    return (
        <View style={styles.rootWrap}>
            {/* Plans grid (monthly-only — no billing toggle) */}
            <View
                style={[
                    styles.plansWrap,
                    vStacked ? styles.plansWrapColumn : styles.plansWrapRow,
                ]}
            >
                {SORTED_FILTER.map((plan) => {
                    const effectiveMonthly = plan.monthly;
                    // Free is "current" whenever the org resolves to the free
                    // plan — it has no subscription/acceptance step, so it must
                    // NOT be gated on status == Accepted. Paid plans still
                    // require an accepted subscription on the matching cycle.
                    const currentPlan = currentPlanKey === plan.key
                        && (plan.key === "free"
                            ? true
                            : currentPlanCycle === billing
                                && selectedOrgBilling?.status == ModelStatus.Accepted)
                    const BuyButton = (<Pressable
                        onPress={() => {
                            if (currentPlan) {
                                window.open(selectedOrgBilling?.subscriptionUrl, "_blank");
                            } else if (manager?.isAdmin) {
                                setCustomPlanKey(plan.key as PlanKey);
                                setCustomModalVisible(true);
                            } else {
                                handleSubmit(plan.key);
                            }
                        }}
                        disabled={currentPlan}
                        style={({ pressed }) => [
                            currentPlan ? styles.buyBtnCurrent : (plan.preferred ? styles.buyBtn : styles.buyBtnAlt),
                            pressed && !currentPlan && styles.buyBtnPressed,
                        ]}
                    >
                        <Text style={currentPlan ? styles.buyTextCurrent : (plan.preferred ? styles.buyText : styles.buyTextAlt)}>
                            {currentPlan ? "Current Plan" :
                                plan.custom ? "Contact Sales" :
                                    (manager?.isAdmin ? `Create Custom Link` : `Start ${plan.name} Plan`)}
                        </Text>
                    </Pressable>)
                    return (
                        <View
                            key={plan.key}
                            style={[
                                styles.planCard,
                                plan.preferred && styles.planPreferred,
                                vStacked ? styles.planCardStacked : styles.planCardRow,
                            ]}
                        >
                            {plan.preferred && (
                                <View style={styles.planTagPreferred}>
                                    <Text style={styles.planTagText}>Most popular</Text>
                                </View>
                            )}

                            <Text style={styles.planName}>
                                {plan.name}
                                {/* ({isYearly ? "Yearly" : "Monthly"}) */}
                            </Text>

                            {plan.custom ? (
                                <>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceMain}>Custom</Text>
                                    </View>
                                    <Text style={styles.billingNote}>Tailored to your needs</Text>
                                </>
                            ) : effectiveMonthly == 0 ? (
                                <>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceMain}>Free</Text>
                                    </View>
                                    <Text style={styles.billingNote}>Free forever</Text>
                                </>
                            ) : (
                                <>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceMain}>${effectiveMonthly}</Text>
                                        <Text style={styles.pricePer}>/ month</Text>
                                    </View>
                                    <Text style={styles.billingNote}>Billed monthly, cancel anytime</Text>
                                </>
                            )}



                            <View style={styles.divider} />

                            {!vStacked && BuyButton}

                            {plan.features.map((f, i) => (
                                <View key={i} style={styles.featureRow}>
                                    <Text style={styles.featureTick}>✓</Text>
                                    <Text style={styles.featureCopy}>{f}</Text>
                                </View>
                            ))}

                            {vStacked && BuyButton}
                        </View>
                    );
                })}
            </View>

            {/* Payment Link Modal */}
            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {modalState === "loading" && (
                            <>
                                <Text style={styles.modalTitle}>Preparing your secure payment</Text>
                                <Text style={styles.modalText}>
                                    Please wait, we are generating your payment link. This usually takes a few seconds.
                                </Text>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </>
                        )}

                        {modalState === "ready" && (
                            <>
                                <Text style={styles.modalTitle}>Payment link is ready</Text>
                                <Text style={styles.modalText}>
                                    Tap the button below to open the payment page in a new tab. After you complete the payment, return to this page.
                                </Text>
                                <Pressable style={({ pressed }) => [styles.modalBtn, pressed && styles.pressed]} onPress={openPaymentLink}>
                                    <Text style={styles.modalBtnText}>Open Payment Link</Text>
                                </Pressable>
                                <Pressable style={({ pressed }) => [styles.modalBtnAlt, pressed && styles.pressed]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalBtnAltText}>Close</Text>
                                </Pressable>
                            </>
                        )}
                        {modalState === 'admin' && (
                            <>
                                <Text style={styles.modalTitle}>Payment Link Generated</Text>
                                <Text style={styles.modalText}>
                                    After payment, please return to this page. It might take 3 to 5 minutes for your payment to reflect on the account.
                                </Text>

                                {/* Payment link with copy */}
                                {paymentUrl && (
                                    <View style={[styles.copyWrap, styles.copyWrapTop]}>
                                        <Text style={styles.label}>Payment link</Text>
                                        <View style={styles.copyRow}>
                                            <Text style={styles.copyTextMono} numberOfLines={1} selectable>{paymentUrl}</Text>
                                            <Pressable accessibilityRole="button" onPress={() => copyText(paymentUrl)} style={({ pressed }) => [styles.copyBtnSmall, pressed && styles.pressed]}>
                                                <Text style={styles.copyBtnText}>Copy</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                )}

                                {/* User details depending on existence */}
                                {!!adminData && (
                                    <View style={styles.modalBlockSpaced}>
                                        {adminData.userExists ? (
                                            <>
                                                <Text style={styles.label}>User account</Text>
                                                <Text style={styles.modalText}>User already exists on Trendly with this email:</Text>
                                                <View style={styles.copyRow}>
                                                    <Text style={styles.copyTextMono} selectable>{adminData.email}</Text>
                                                    <Pressable accessibilityRole="button" onPress={() => copyText(adminData.email)} style={({ pressed }) => [styles.copyBtnSmall, pressed && styles.pressed]}>
                                                        <Text style={styles.copyBtnText}>Copy</Text>
                                                    </Pressable>
                                                </View>
                                                <Text style={styles.modalTextTight}>Password is not included because the user previously registered.</Text>
                                                <View style={[styles.copyRow, styles.copyRowTight]}>
                                                    <Text style={styles.copyTextMono} selectable>https://brands.trendly.now/login</Text>
                                                    <Pressable accessibilityRole="button" onPress={() => copyText('https://brands.trendly.now/login')} style={({ pressed }) => [styles.copyBtnSmall, pressed && styles.pressed]}>
                                                        <Text style={styles.copyBtnText}>Copy</Text>
                                                    </Pressable>
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <Text style={styles.label}>New user credentials</Text>
                                                <View style={styles.copyRow}>
                                                    <Text style={[styles.copyTextMono, styles.copyTextMonoLabel]}>Email:</Text>
                                                    <Text style={[styles.copyTextMono, styles.copyTextMonoValue]} selectable>{adminData.email}</Text>
                                                    <Pressable accessibilityRole="button" onPress={() => copyText(adminData.email)} style={({ pressed }) => [styles.copyBtnSmall, pressed && styles.pressed]}>
                                                        <Text style={styles.copyBtnText}>Copy</Text>
                                                    </Pressable>
                                                </View>
                                                <View style={[styles.copyRow, styles.copyRowTight]}>
                                                    <Text style={[styles.copyTextMono, styles.copyTextMonoLabel]}>Password:</Text>
                                                    <Text style={[styles.copyTextMono, styles.copyTextMonoValue]} selectable>{adminData.password}</Text>
                                                    <Pressable accessibilityRole="button" onPress={() => copyText(adminData.password || '')} style={({ pressed }) => [styles.copyBtnSmall, pressed && styles.pressed]}>
                                                        <Text style={styles.copyBtnText}>Copy</Text>
                                                    </Pressable>
                                                </View>
                                                <View style={[styles.copyRow, styles.copyRowTight]}>
                                                    <Text style={styles.copyTextMono} selectable>https://brands.trendly.now/login</Text>
                                                    <Pressable accessibilityRole="button" onPress={() => copyText('https://brands.trendly.now/login')} style={({ pressed }) => [styles.copyBtnSmall, pressed && styles.pressed]}>
                                                        <Text style={styles.copyBtnText}>Copy</Text>
                                                    </Pressable>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                )}

                                {/* Copy formatted message */}
                                {!!formattedAdminMessage && (
                                    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.modalBtnCopyMessage, pressed && styles.pressed]} onPress={() => copyText(formattedAdminMessage)}>
                                        <Text style={styles.modalBtnText}>Copy message for customer</Text>
                                    </Pressable>
                                )}

                                <Pressable style={({ pressed }) => [styles.modalBtnAlt, pressed && styles.pressed]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalBtnAltText}>Got it</Text>
                                </Pressable>
                            </>
                        )}


                        {modalState === "opened" && (
                            <>
                                <Text style={styles.modalTitle}>Complete your payment</Text>
                                <Text style={styles.modalText}>
                                    After payment, please return to this page. It might take 3 to 5 minutes for your payment to reflect on your account. Don’t worry if it doesn’t show up immediately.
                                </Text>
                                <Text style={styles.modalTextTight}>
                                    Need help? Write to us at <Text style={styles.modalLink}>support@trendly.now</Text>
                                </Text>
                                <Pressable style={({ pressed }) => [styles.modalBtnAlt, pressed && styles.pressed]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalBtnAltText}>Got it</Text>
                                </Pressable>
                            </>
                        )}

                        {modalState === "error" && (
                            <>
                                <Text style={styles.modalTitle}>Unable to create link</Text>
                                <Text style={styles.modalText}>
                                    Something went wrong while generating your payment link. Please try again in a moment or contact <Text style={styles.modalLink}>support@trendly.now</Text>.
                                </Text>
                                <Pressable style={({ pressed }) => [styles.modalBtnAlt, pressed && styles.pressed]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalBtnAltText}>Close</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
            {/* Custom Link Modal for Admins */}
            <CreateCustomLinkModal
                visible={customModalVisible}
                onClose={() => setCustomModalVisible(false)}
                planKey={customPlanKey ?? (PLANS[0].key as PlanKey)}
                planCycle={billing}
                onSubmit={(adminData, planKey, planCycle) => {
                    handleSubmit(planKey, adminData)
                    setCustomModalVisible(false);
                }}
            />
        </View>
    );
};

export default PlanWrapper;


function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        rootWrap: { marginTop: 16, width: "100%" },
        plansWrapColumn: { flexDirection: "column" },
        plansWrapRow: { flexDirection: "row", flexWrap: "wrap" },
        planCardStacked: { width: "100%" },
        planCardRow: { minWidth: 260, flex: 1 },
        buyBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
        copyWrapTop: { marginTop: 12 },
        modalBlockSpaced: { marginTop: 12 },
        modalTextTight: {
            color: colors.textSecondary,
            fontSize: 13,
            lineHeight: 18,
            marginTop: 6,
        },
        copyRowTight: { marginTop: 6 },
        copyTextMonoLabel: { flexShrink: 0 },
        copyTextMonoValue: { flex: 1 },
        copyBtnText: { color: colors.onPrimary, fontWeight: "800", fontSize: 12 },
        modalBtnCopyMessage: {
            marginTop: 16,
            backgroundColor: colors.primary,
            height: 44,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },

        /* Container helpers kept for future reuse (page/hero/etc. preserved from prior file) */
        page: {
            paddingHorizontal: 24,
            paddingTop: Platform.select({ web: 36, default: 24 }),
            paddingBottom: 48,
            backgroundColor: colors.background,
            maxWidth: 1300,
            alignSelf: "center",
            width: "100%",
        },

        /* Plans */
        plansWrap: { marginTop: 16, gap: 16 },
        planCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            shadowColor: colors.text,
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            ...Platform.select({ android: { elevation: 1 } }),
        },
        planPreferred: {
            borderColor: colors.primary,
            shadowOpacity: 0.08,
            ...Platform.select({ android: { elevation: 2 } }),
        },
        planTagPreferred: {
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
        },
        planTagText: { color: colors.onPrimary, fontSize: 11, fontWeight: "800" },
        planName: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 2 },
        priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6, flexWrap: "wrap" },
        priceMain: { color: colors.text, fontSize: 28, fontWeight: "900" },
        priceSlash: { color: colors.textSecondary, textDecorationLine: "line-through", marginLeft: 8, marginBottom: 2 },
        pricePer: { color: colors.textSecondary, marginLeft: 6, marginBottom: 2 },
        savingsText: { color: colors.success, fontWeight: "700", fontSize: 12, marginTop: 4 },
        billingNote: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
        divider: { height: 1, backgroundColor: colors.surface, marginVertical: 12 },
        featureRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
        featureTick: { fontSize: 16, marginRight: 10, color: colors.primary },
        featureCopy: { color: colors.text, fontSize: 13 },
        buyBtn: {
            marginVertical: 14,
            backgroundColor: colors.primary,
            height: 46,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        buyText: { color: colors.onPrimary, fontWeight: "800" },
        buyBtnAlt: {
            marginVertical: 14,
            backgroundColor: colors.tag,
            height: 46,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
        },
        buyTextAlt: { color: colors.tagForeground, fontWeight: "800" },

        buyBtnCurrent: {
            marginVertical: 14,
            backgroundColor: colors.tag,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: 0.95,
            height: 46,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        buyTextCurrent: { color: colors.tagForeground, fontWeight: "900" },

        /* Compare hint kept for reuse */
        compareHint: { marginTop: 12, color: colors.textSecondary, fontSize: 12 },

        /* Toggle */
        toggleWrap: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
            alignSelf: "center",
            maxWidth: "100%",
        },
        togglePill: {
            flexDirection: "row",
            alignItems: "stretch",
            backgroundColor: colors.tag,
            borderRadius: 999,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
            maxWidth: "100%",
        },
        toggleItem: {
            paddingHorizontal: 12,
            minHeight: 36,
            paddingVertical: 4,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        toggleYearlyRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 6,
            maxWidth: "100%",
        },
        toggleItemActive: {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.primary,
            shadowColor: colors.text,
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            ...Platform.select({ android: { elevation: 2 } }),
        },
        toggleText: { color: colors.text, fontWeight: "700", fontSize: 14 },
        toggleTextActive: { color: colors.primary },
        discountPillAlt: {
            backgroundColor: colors.primaryDark,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
        },
        discountText: { color: colors.onPrimary, fontWeight: "600", fontSize: 10 },

        /* Modal styles */
        modalOverlay: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
        },
        modalCard: {
            width: "100%",
            maxWidth: 420,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.text,
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            ...Platform.select({ android: { elevation: 4 } }),
        },
        modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 6 },
        modalText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
        modalLink: { color: colors.primary, fontWeight: "700" },
        modalBtn: {
            marginTop: 14,
            backgroundColor: colors.primary,
            height: 44,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        modalBtnText: { color: colors.onPrimary, fontWeight: "800" },
        modalBtnAlt: {
            marginTop: 10,
            backgroundColor: colors.surface,
            height: 44,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
        },
        modalBtnAltText: { color: colors.text, fontWeight: "800" },

        /* Misc */
        pressed: { opacity: 0.9 },

        copyWrap: {},
        label: { color: colors.text, fontWeight: '800', marginBottom: 6 },
        copyRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingVertical: 8,
            paddingHorizontal: 10,
            marginTop: 6,
        },
        copyTextMono: {
            flex: 1,
            color: colors.text,
            fontFamily: Platform.select({ web: 'monospace', default: 'System' }),
            fontSize: 12,
        },
        copyBtnSmall: {
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            height: 32,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });
}

