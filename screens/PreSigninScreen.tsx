import GlassBackground from "@/components/glass/GlassBackground";
import GlassButton from "@/components/glass/GlassButton";
import GlassCard from "@/components/glass/GlassCard";
import TermsAndCondition from "@/components/TermsAndCondition";
import BottomSheetScrollContainer from "@/components/ui/bottom-sheet/BottomSheetWithScroll";
import Colors from "@/constants/Colors";
import AppLayout from "@/layouts/app-layout";
import { useAppleLogin } from "@/utils/use-apple-login";
import { useGoogleLogin } from "@/utils/use-google-login";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

const CARD_MAX_WIDTH = 520;
const CARD_MIN_WIDTH = 300;
const CARD_GAP = 18;
const HEADER_GAP = 10;
const BUTTON_GAP = 12;
const CARD_MARGIN_HORIZONTAL = 24;
const CARD_ANIMATION_DELAY = 120;
const CARD_ANIMATION_DURATION = 420;
const CARD_TRANSLATE_Y = 18;
const CARD_SCALE_FROM = 0.98;
const TITLE_FONT_SIZE = 28;
const TITLE_LETTER_SPACING = 0.4;
const TAGLINE_FONT_SIZE = 15;
const TAGLINE_LINE_HEIGHT = 22;
const ERROR_TEXT_MARGIN_TOP = 18;
const TITLE_COLOR = "#0F172A";
const TAGLINE_COLOR = "rgba(15, 23, 42, 0.7)";
const ERROR_COLOR = "#FF6B6B";
const CTA_LABEL = "Get Started";
const GOOGLE_LABEL = "Continue with Google";
const APPLE_LABEL = "Continue with Apple";
const EMAIL_LABEL = "Continue with Email/Password";
const TAGLINE = "Create and manage premium collaborations in one calm space.";
const APP_NAME = "Trendly Brands";
const TERMS_FONT_SIZE = 12;
const TERMS_LINE_HEIGHT = 18;
const TERMS_MARGIN_TOP = 22;
const TERMS_LINK_DECORATION = "underline" as const;
const TERMS_TEXT_COLOR = "rgba(15, 23, 42, 0.65)";

const PreSigninScreen = () => {
    const theme = useTheme();
    const router = useRouter();
    const brandColor = Colors(theme).primary;
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);
    const { googleLogin } = useGoogleLogin(setLoading, setError);
    const { appleLogin } = useAppleLogin(setLoading, setError);
    // Apple sign-in is only supported on iOS.
    const showApple = useMemo(() => Platform.OS === "ios", []);

    return (
        <AppLayout>
            <View style={styles.container}>
                <GlassBackground />
                <MotiView
                    from={{ opacity: 0, translateY: CARD_TRANSLATE_Y, scale: CARD_SCALE_FROM }}
                    animate={{ opacity: 1, translateY: 0, scale: 1 }}
                    transition={{
                        type: "timing",
                        duration: CARD_ANIMATION_DURATION,
                        delay: CARD_ANIMATION_DELAY,
                    }}
                    style={styles.cardWrapper}
                >
                    <GlassCard>
                        <View style={styles.header}>
                            <Text style={styles.title}>{APP_NAME}</Text>
                            <Text style={styles.tagline}>{TAGLINE}</Text>
                        </View>
                        <View style={styles.buttonStack}>
                            <GlassButton
                                label={CTA_LABEL}
                                variant="primary"
                                accentColor={brandColor}
                                onPress={() => {
                                    router.push("/create-new-account");
                                }}
                                disabled={loading}
                            />
                            <GlassButton
                                label={GOOGLE_LABEL}
                                variant="secondary"
                                accentColor={brandColor}
                                onPress={googleLogin}
                                disabled={loading}
                            />
                            {showApple && (
                                <GlassButton
                                    label={APPLE_LABEL}
                                    variant="secondary"
                                    accentColor={brandColor}
                                    onPress={appleLogin}
                                    disabled={loading}
                                />
                            )}
                            <GlassButton
                                label={EMAIL_LABEL}
                                variant="secondary"
                                accentColor={brandColor}
                                onPress={() => {
                                    router.push("/create-new-account");
                                }}
                                disabled={loading}
                            />
                        </View>
                        <Text style={styles.termsText}>
                            By proceeding to signup, you agree to{" "}
                            <Text
                                style={[styles.termsText, styles.termsLink]}
                                onPress={() => setTermsVisible(true)}
                            >
                                Terms & Condition (EULA)
                            </Text>{" "}
                            of Trendly
                        </Text>
                        {error && <Text style={styles.errorText}>{error}</Text>}
                    </GlassCard>
                </MotiView>
            </View>
            <BottomSheetScrollContainer
                isVisible={termsVisible}
                snapPointsRange={["85%", "85%"]}
                onClose={() => {
                    setTermsVisible(false);
                }}
            >
                <TermsAndCondition />
            </BottomSheetScrollContainer>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: CARD_MARGIN_HORIZONTAL,
    },
    cardWrapper: {
        width: "100%",
        maxWidth: CARD_MAX_WIDTH,
        minWidth: CARD_MIN_WIDTH,
    },
    header: {
        gap: HEADER_GAP,
        marginBottom: CARD_GAP,
    },
    title: {
        fontSize: TITLE_FONT_SIZE,
        fontWeight: "600",
        color: TITLE_COLOR,
        letterSpacing: TITLE_LETTER_SPACING,
    },
    tagline: {
        fontSize: TAGLINE_FONT_SIZE,
        lineHeight: TAGLINE_LINE_HEIGHT,
        color: TAGLINE_COLOR,
    },
    buttonStack: {
        gap: BUTTON_GAP,
    },
    errorText: {
        marginTop: ERROR_TEXT_MARGIN_TOP,
        color: ERROR_COLOR,
        textAlign: "center",
    },
    termsText: {
        marginTop: TERMS_MARGIN_TOP,
        fontSize: TERMS_FONT_SIZE,
        lineHeight: TERMS_LINE_HEIGHT,
        color: TERMS_TEXT_COLOR,
        textAlign: "center",
    },
    termsLink: {
        color: TITLE_COLOR,
        textDecorationLine: TERMS_LINK_DECORATION,
    },
});

export default PreSigninScreen;
