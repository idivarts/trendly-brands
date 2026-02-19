import TermsAndCondition from "@/components/TermsAndCondition";
import BottomSheetScrollContainer from "@/components/ui/bottom-sheet/BottomSheetWithScroll";
import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { useAppleLogin } from "@/utils/use-apple-login";
import { useGoogleLogin } from "@/utils/use-google-login";
import { faApple, faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const CARD_MAX_WIDTH = 520;
const CARD_MIN_WIDTH = 300;
const CARD_PADDING_XS = 24;
const CARD_PADDING_DEFAULT = 32;
const CARD_RADIUS = 24;
const CARD_GAP = 18;
const BUTTON_GAP = 12;
const CARD_MARGIN_HORIZONTAL = 24;
const CARD_ANIMATION_DELAY = 120;
const CARD_ANIMATION_DURATION = 420;
const CARD_PRESS_SCALE = 0.98;
const CARD_PRESS_DURATION = 100;
const CARD_TRANSLATE_Y = 18;
const CARD_SCALE_FROM = 0.98;
const TITLE_FONT_SIZE = 28;
const TITLE_FONT_SIZE_XS = 24;
const TITLE_LETTER_SPACING = 0.4;
const SUBTITLE_FONT_SIZE = 15;
const SUBTITLE_LINE_HEIGHT = 22;
const TERMS_FONT_SIZE = 12;
const TERMS_LINE_HEIGHT = 18;
const TERMS_MARGIN_TOP = 22;
const TITLE = "Sign in with email";
const SUBTITLE =
    "Create and manage premium collaborations in one calm space.";
const CTA_LABEL = "Get Started";
const GOOGLE_LABEL = "Continue with Google";
const APPLE_LABEL = "Continue with Apple";
const EMAIL_LABEL = "Continue with Email/Password";

const PreSigninScreen = () => {
    const theme = useTheme();
    const router = useRouter();
    const colors = Colors(theme);
    const { xs } = useBreakpoints();
    const insets = useSafeAreaInsets();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);

    const { googleLogin } = useGoogleLogin(setLoading, setError);
    const { appleLogin } = useAppleLogin(setLoading, setError);
    const showApple = useMemo(() => Platform.OS === "ios", []);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(CARD_TRANSLATE_Y)).current;
    const scaleAnim = useRef(new Animated.Value(CARD_SCALE_FROM)).current;
    const cardPressScale = useRef(new Animated.Value(1)).current;

    const handleCardPressIn = () => {
        Animated.timing(cardPressScale, {
            toValue: CARD_PRESS_SCALE,
            duration: CARD_PRESS_DURATION,
            useNativeDriver: true,
        }).start();
    };

    const handleCardPressOut = () => {
        Animated.timing(cardPressScale, {
            toValue: 1,
            duration: CARD_PRESS_DURATION,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: CARD_ANIMATION_DURATION,
                delay: CARD_ANIMATION_DELAY,
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: CARD_ANIMATION_DURATION,
                delay: CARD_ANIMATION_DELAY,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: CARD_ANIMATION_DURATION,
                delay: CARD_ANIMATION_DELAY,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, translateYAnim, scaleAnim]);

    const cardPadding = xs ? CARD_PADDING_XS : CARD_PADDING_DEFAULT;
    const titleFontSize = xs ? TITLE_FONT_SIZE_XS : TITLE_FONT_SIZE;

    const backgroundStyle = {
        backgroundColor: theme.dark ? colors.background : colors.aliceBlue,
    };

    const cardStyle = {
        backgroundColor: colors.card,
        borderRadius: CARD_RADIUS,
        padding: cardPadding,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    };

    return (
        <>
            <ExpoStatusBar style={!theme.dark ? "dark" : "light"} />
            <KeyboardAvoidingView
                style={[styles.keyboardAvoid, backgroundStyle]}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/** Subtle background pattern */}
                {!theme.dark && (
                    <View style={styles.backgroundPattern} pointerEvents="none">
                        <View
                            style={[
                                styles.patternCircle,
                                {
                                    backgroundColor: colors.primary,
                                    opacity: 0.06,
                                    top: 80,
                                    left: 40,
                                },
                            ]}
                        />
                        <View
                            style={[
                                styles.patternCircle,
                                {
                                    backgroundColor: colors.outline,
                                    opacity: 0.05,
                                    top: 320,
                                    right: 60,
                                },
                            ]}
                        />
                        <View
                            style={[
                                styles.patternCircle,
                                {
                                    backgroundColor: colors.primary,
                                    opacity: 0.04,
                                    top: 500,
                                    left: 80,
                                },
                            ]}
                        />
                    </View>
                )}
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingTop: 24 + insets.top,
                            paddingBottom: 24 + insets.bottom,
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/** Centered card */}
                    <Animated.View
                        style={[
                            styles.cardWrapper,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: translateYAnim },
                                    { scale: Animated.multiply(scaleAnim, cardPressScale) },
                                ],
                            },
                        ]}
                    >
                        <Pressable
                            onPressIn={handleCardPressIn}
                            onPressOut={handleCardPressOut}
                            style={[styles.card, cardStyle]}
                        >
                            {/** Title and subtitle */}
                            <Text
                                style={[
                                    styles.title,
                                    {
                                        fontSize: titleFontSize,
                                        color: colors.text,
                                    },
                                ]}
                            >
                                {TITLE}
                            </Text>
                            <Text
                                style={[
                                    styles.subtitle,
                                    { color: colors.gray100 },
                                ]}
                            >
                                {SUBTITLE}
                            </Text>

                            {/** 3 buttons */}
                            <View style={styles.buttonStack}>
                                <Pressable
                                    onPressIn={handleCardPressIn}
                                    onPressOut={handleCardPressOut}
                                    onPress={() =>
                                        router.push("/create-new-account")
                                    }
                                    disabled={loading}
                                    style={[
                                        styles.ctaButton,
                                        {
                                            backgroundColor: colors.primary,
                                            opacity: loading ? 0.6 : 1,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.ctaLabel,
                                            { color: colors.onPrimary },
                                        ]}
                                    >
                                        {CTA_LABEL}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPressIn={handleCardPressIn}
                                    onPressOut={handleCardPressOut}
                                    onPress={googleLogin}
                                    disabled={loading}
                                    style={[
                                        styles.secondaryButton,
                                        {
                                            backgroundColor: colors.tag,
                                            borderColor: colors.outline,
                                            opacity: loading ? 0.6 : 1,
                                        },
                                    ]}
                                >
                                    <FontAwesomeIcon
                                        icon={faGoogle}
                                        size={20}
                                        color={colors.text}
                                    />
                                    <Text
                                        style={[
                                            styles.secondaryLabel,
                                            { color: colors.text },
                                        ]}
                                    >
                                        {GOOGLE_LABEL}
                                    </Text>
                                </Pressable>
                                {showApple ? (
                                    <Pressable
                                        onPressIn={handleCardPressIn}
                                        onPressOut={handleCardPressOut}
                                        onPress={appleLogin}
                                        disabled={loading}
                                        style={[
                                            styles.secondaryButton,
                                            {
                                                backgroundColor: colors.tag,
                                                borderColor: colors.outline,
                                                opacity: loading ? 0.6 : 1,
                                            },
                                        ]}
                                    >
                                        <FontAwesomeIcon
                                            icon={faApple}
                                            size={20}
                                            color={colors.text}
                                        />
                                        <Text
                                            style={[
                                                styles.secondaryLabel,
                                                { color: colors.text },
                                            ]}
                                        >
                                            {APPLE_LABEL}
                                        </Text>
                                    </Pressable>
                                ) : (
                                    <Pressable
                                        onPressIn={handleCardPressIn}
                                        onPressOut={handleCardPressOut}
                                        onPress={() =>
                                            router.push("/create-new-account")
                                        }
                                        disabled={loading}
                                        style={[
                                            styles.secondaryButton,
                                            {
                                                backgroundColor: colors.tag,
                                                borderColor: colors.outline,
                                                opacity: loading ? 0.6 : 1,
                                            },
                                        ]}
                                    >
                                        <FontAwesomeIcon
                                            icon={faEnvelope}
                                            size={20}
                                            color={colors.text}
                                        />
                                        <Text
                                            style={[
                                                styles.secondaryLabel,
                                                { color: colors.text },
                                            ]}
                                        >
                                            {EMAIL_LABEL}
                                        </Text>
                                    </Pressable>
                                )}
                            </View>

                            {error && (
                                <Text
                                    style={[
                                        styles.errorText,
                                        { color: colors.pinkForeground },
                                    ]}
                                >
                                    {error}
                                </Text>
                            )}

                            {/** Terms */}
                            <Text
                                style={[
                                    styles.termsText,
                                    { color: colors.gray100 },
                                ]}
                            >
                                By proceeding to signup, you agree to{" "}
                                <Text
                                    style={[
                                        styles.termsLink,
                                        {
                                            color: colors.primary,
                                        },
                                    ]}
                                    onPress={() => setTermsVisible(true)}
                                >
                                    Terms & Condition (EULA)
                                </Text>{" "}
                                of Trendly
                            </Text>
                        </Pressable>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <BottomSheetScrollContainer
                isVisible={termsVisible}
                snapPointsRange={["85%", "85%"]}
                onClose={() => setTermsVisible(false)}
            >
                <TermsAndCondition />
            </BottomSheetScrollContainer>
        </>
    );
};

const styles = StyleSheet.create({
    keyboardAvoid: {
        flex: 1,
    },
    backgroundPattern: {
        ...StyleSheet.absoluteFillObject,
    },
    patternCircle: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: CARD_MARGIN_HORIZONTAL,
        paddingVertical: 24,
    },
    cardWrapper: {
        width: "100%",
        maxWidth: CARD_MAX_WIDTH,
        minWidth: CARD_MIN_WIDTH,
    },
    card: {
        gap: CARD_GAP,
    },
    title: {
        fontWeight: "600",
        letterSpacing: 0.4,
        textAlign: "center",
    },
    subtitle: {
        fontSize: SUBTITLE_FONT_SIZE,
        lineHeight: SUBTITLE_LINE_HEIGHT,
        textAlign: "center",
    },
    buttonStack: {
        gap: BUTTON_GAP,
    },
    ctaButton: {
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    ctaLabel: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    secondaryButton: {
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    secondaryLabel: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    errorText: {
        marginTop: 8,
        textAlign: "center",
        fontSize: 14,
    },
    termsText: {
        marginTop: TERMS_MARGIN_TOP,
        fontSize: TERMS_FONT_SIZE,
        lineHeight: TERMS_LINE_HEIGHT,
        textAlign: "center",
    },
    termsLink: {
        textDecorationLine: "underline",
    },
});

export default PreSigninScreen;
