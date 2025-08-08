import AppLayout from "@/layouts/app-layout";
import React, { useState } from "react";
import {
    Image,
    ImageBackground,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";

// --- Content & links ---
const FEATURE_ITEMS = [
    { icon: "📘", title: "Marketing Partner", sub: "Facebook Premier Level Agency Partner" },
    { icon: "🟦", title: "Google Endorsed", sub: "Marketing Partner" },
    { icon: "📰", title: "Forbes Agency", sub: "Council Member" },
    { icon: "🏆", title: "Inc. 5000", sub: "Fastest Growing Company" },
];

const ONBOARD_IMG =
    "https://www.trendly.now/wp-content/uploads/2025/05/thumbnail-youtube-and-web-for-video.avif"; // placeholder visual

const CAL_LINK = "https://cal.com/rahul-idiv/30min";
const CREATE_BRAND_LINK = "https://brands.trendly.now/pre-signin?skip=1";

export default function CreateBrandPage() {
    const { width } = useWindowDimensions();
    const isWide = width >= 1000;

    const [brandName, setBrandName] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<{ brand?: string; phone?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const open = (url: string) => Linking.openURL(url).catch(() => { });

    function validate() {
        const e: { brand?: string; phone?: string } = {};
        if (!brandName || brandName.trim().length < 2) e.brand = "Please enter your brand name.";
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 10 || digits.length > 15) e.phone = "Enter a valid phone number.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit() {
        if (submitting) return;
        if (!validate()) return;
        try {
            setSubmitting(true);
            const url = `${CREATE_BRAND_LINK}&brand=${encodeURIComponent(brandName.trim())}&phone=${encodeURIComponent(phone.trim())}`;
            open(url);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AppLayout>
            <ScrollView
                contentContainerStyle={styles.page}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        source={require("@/assets/images/rectangluar blue logo transparent.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Pressable style={styles.demoBtn} onPress={() => open(CAL_LINK)}>
                        <Text style={styles.demoIcon}>🎥</Text>
                        <Text style={styles.demoText}>Request a Demo</Text>
                    </Pressable>
                </View>

                {/* Main Hero - Explainer (left) + Form (right) */}
                <View style={[styles.hero, isWide ? styles.heroRow : styles.heroCol]}>
                    {/* Left: Explainer */}
                    <View style={[styles.left, isWide ? { paddingRight: 90 } : {}]}>
                        <Text style={styles.kicker}>BRAND ONBOARDING</Text>
                        <Text style={styles.title}>
                            Create your <Text style={styles.titleAccent}>brand</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Start hiring verified influencers without middlemen. Post a collaboration,
                            pick applications you like, and pay securely when you finalize. No setup
                            fees and no commissions — just direct connections that work.
                        </Text>

                        <View style={styles.points}>
                            <View style={styles.pointItem}>
                                <Text style={styles.pointIcon}>✅</Text>
                                <Text style={styles.pointText}>Get matched to niche influencers fast</Text>
                            </View>
                            <View style={styles.pointItem}>
                                <Text style={styles.pointIcon}>✅</Text>
                                <Text style={styles.pointText}>Transparent chats, contracts, and payouts</Text>
                            </View>
                            <View style={styles.pointItem}>
                                <Text style={styles.pointIcon}>✅</Text>
                                <Text style={styles.pointText}>Fraud protection and dispute assistance</Text>
                            </View>
                        </View>

                        {/* Visual */}
                        <ImageBackground
                            source={{ uri: ONBOARD_IMG }}
                            style={styles.visual}
                            imageStyle={styles.visualImg}
                        >
                            <View style={styles.playBadge}>
                                <Text style={styles.playBadgeText}>Overview</Text>
                            </View>
                        </ImageBackground>
                    </View>

                    {/* Right: Form */}
                    <View style={styles.formCard}>
                        {/* Stepper */}
                        <View style={styles.stepperWrap}>
                            <Text style={styles.stepperLabel}>Step 2 of 3</Text>
                            <View style={styles.stepperRow}>
                                {/* Step 1 */}
                                <View style={styles.stepGroup}>
                                    <View style={[styles.stepDot, styles.stepDone]}>
                                        <Text style={styles.stepNum}>1</Text>
                                    </View>
                                    <View style={[styles.stepBar, styles.stepBarDone]} />
                                </View>
                                {/* Step 2 (current) */}
                                <View style={styles.stepGroup}>
                                    <View style={[styles.stepDot, styles.stepCurrent]}>
                                        <Text style={styles.stepNum}>2</Text>
                                    </View>
                                    <View style={[styles.stepBar, styles.stepBarPending]} />
                                </View>
                                {/* Step 3 */}
                                <View style={styles.stepGroup}>
                                    <View style={[styles.stepDot, styles.stepPending]}>
                                        <Text style={styles.stepNum}>3</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.formHeading}>Create your brand</Text>
                        <Text style={styles.formSub}>It takes less than a minute to get started.</Text>

                        <View style={styles.field}>
                            <Text style={styles.label}>Brand name</Text>
                            <TextInput
                                value={brandName}
                                onChangeText={setBrandName}
                                placeholder="e.g., Acme Naturals"
                                style={[styles.input, !!errors.brand && styles.inputError]}
                                autoCapitalize="words"
                                autoCorrect={false}
                                accessibilityLabel="Brand name"
                            />
                            {!!errors.brand && <Text style={styles.error}>{errors.brand}</Text>}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Phone number</Text>
                            <TextInput
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="e.g., 9876543210"
                                style={[styles.input, !!errors.phone && styles.inputError]}
                                keyboardType={Platform.select({ ios: "number-pad", android: "phone-pad", default: "numeric" }) as any}
                                accessibilityLabel="Phone number"
                            />
                            {!!errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
                        </View>

                        <Pressable
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={({ pressed }) => [
                                styles.cta,
                                (pressed || submitting) && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Create brand"
                        >
                            <Text style={styles.ctaText}>{submitting ? "Please wait…" : "Create brand"}</Text>
                            <Text style={styles.ctaArrow}>›</Text>
                        </Pressable>

                        <Text style={styles.disclaimer}>
                            By continuing, you agree to receive updates about your brand setup on the
                            phone number provided.
                        </Text>
                    </View>
                </View>

                {/* Feature summary strip */}
                <View style={styles.featuresBar}>
                    <View style={styles.featuresInner}>
                        {FEATURE_ITEMS.map((f, idx) => (
                            <View key={idx} style={styles.featureItem}>
                                <Text style={styles.featureIcon}>{f.icon}</Text>
                                <View style={styles.featureTextWrap}>
                                    <Text style={styles.featureTitle}>{f.title}</Text>
                                    <Text style={styles.featureSub}>{f.sub}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </AppLayout>
    );
}

/* --------- Styles --------- */
const BLUE = "#254F7A";
const BLUE_DARK = "#1A3B5C";
const BLUE_LIGHT = "#6C91BA";
const TEXT = "#243A53";

const styles = StyleSheet.create({
    page: {
        paddingHorizontal: 24,
        paddingTop: Platform.select({ web: 36, default: 24 }),
        paddingBottom: 48,
        backgroundColor: "#FFFFFF",
        maxWidth: 1300,
        alignSelf: "center",
        width: "100%",
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    logo: {
        width: 180,
        height: 75,
    },
    demoBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        height: 42,
        borderRadius: 999,
        backgroundColor: "#EEF4FB",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        ...Platform.select({ android: { elevation: 3 } }),
    },
    demoIcon: { fontSize: 16, marginRight: 8 },
    demoText: { color: TEXT, fontSize: 14, fontWeight: "600" },

    /* Hero layout */
    hero: {
        backgroundColor: "#F8FBFF",
        borderRadius: 24,
        padding: 28,
        marginTop: 0,
    },
    heroRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    heroCol: {
        flexDirection: "column",
    },

    /* Left */
    left: {
        flex: 1.3,
    },
    kicker: {
        color: BLUE_LIGHT,
        fontSize: 12,
        letterSpacing: 1.4,
        fontWeight: "700",
        marginBottom: 8,
    },
    title: {
        color: TEXT,
        fontSize: 48,
        lineHeight: 62,
        fontWeight: "600",
        marginTop: 4,
    },
    titleAccent: {
        color: BLUE,
        textDecorationLine: "underline",
        textDecorationColor: "#CFE2F7",
        textDecorationStyle: "solid",
    },
    subtitle: {
        marginTop: 18,
        marginBottom: 14,
        color: "#53657A",
        fontSize: 16,
        lineHeight: 24,
        maxWidth: 640,
    },
    points: { marginTop: 8, gap: 10 },
    pointItem: { flexDirection: "row", alignItems: "center" },
    pointIcon: { fontSize: 18, marginRight: 10 },
    pointText: { color: TEXT, fontSize: 14 },

    /* Visual under explainer */
    visual: {
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: 20,
        overflow: "hidden",
        justifyContent: "flex-end",
        marginTop: 18,
        backgroundColor: "#E7F0F9",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    visualImg: { resizeMode: "cover" },
    playBadge: {
        alignSelf: "flex-start",
        margin: 12,
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    playBadgeText: { color: BLUE_DARK, fontWeight: "800" },

    /* Form */
    formCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 22,
        marginTop: 18,
        ...Platform.select({ web: { maxWidth: 520 } }),
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        ...Platform.select({ android: { elevation: 4 } }),
    },
    formHeading: { fontSize: 24, fontWeight: "800", color: TEXT },
    formSub: { marginTop: 6, color: "#6C7A89", fontSize: 13 },
    field: { marginTop: 16 },
    label: { color: TEXT, fontSize: 13, fontWeight: "700", marginBottom: 6 },
    input: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E1E6EE",
        paddingHorizontal: 14,
        backgroundColor: "#FAFCFF",
        color: TEXT,
    },
    inputError: { borderColor: "#E87070" },
    error: { color: "#D64545", marginTop: 6, fontSize: 12 },
    disclaimer: { color: "#6C7A89", marginTop: 12, fontSize: 12 },

    /* CTA reused */
    cta: {
        marginTop: 18,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        height: 48,
        borderRadius: 999,
        backgroundColor: BLUE,
        shadowColor: "#2B5C8F",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    ctaText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    ctaArrow: {
        color: "#FFFFFF",
        fontSize: 22,
        marginLeft: 10,
        marginTop: -2,
    },

    /* Feature summary strip */
    featuresBar: {
        marginTop: 40,
        backgroundColor: "#1f3f73",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    featuresInner: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        rowGap: 12,
        gap: 12,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        minWidth: 150,
        flexShrink: 0,
    },
    featureIcon: {
        fontSize: 42,
        marginRight: 16,
        color: "#FFFFFF",
    },
    featureTextWrap: { flexShrink: 1, gap: 8 },
    featureTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.2,
    },
    featureSub: { color: "#D6E2F5", fontSize: 12, marginTop: 2 },
    // Stepper
    stepperWrap: {
        marginBottom: 28,
    },
    stepperLabel: {
        color: TEXT,
        fontSize: 12,
        fontWeight: '700',
        opacity: 0.8,
        marginBottom: 8,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 16,
        height: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9F0F8',
        borderWidth: 1,
        borderColor: '#E1E6EE',
    },
    stepNum: {
        color: TEXT,
        fontSize: 13,
        fontWeight: '800',
    },
    stepBar: {
        height: 4,
        borderRadius: 4,
        marginHorizontal: 10,
        flex: 1,
        backgroundColor: '#E9F0F8',
    },
    stepDone: {
        backgroundColor: BLUE,
        borderColor: BLUE,
    },
    stepCurrent: {
        backgroundColor: BLUE_DARK,
        borderColor: BLUE_DARK,
    },
    stepPending: {
        backgroundColor: '#E9F0F8',
        borderColor: '#E1E6EE',
    },
    stepBarDone: {
        backgroundColor: BLUE_LIGHT,
    },
    stepBarPending: {
        backgroundColor: '#E9F0F8',
    },
});
