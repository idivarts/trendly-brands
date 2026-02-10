import type { InfluencerItem } from "@/components/discover/discover-types";
import InfluencerCard from "@/components/explore-influencers/InfluencerCard";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

const BACKGROUND_GRADIENT: readonly [string, string, string] = [
    "#F7F9FC",
    "#EFF3F9",
    "#E9EEF6",
];
const FLOATING_CARD_MAX_WIDTH = 460;
const FLOATING_CARD_RADIUS = 24;
const FLOATING_CARD_PADDING = 18;
const FLOATING_CARD_BORDER = 1;
const FLOATING_CARD_BACKGROUND = "rgba(255,255,255,0.9)";
const FLOATING_CARD_BORDER_COLOR = "rgba(15, 23, 42, 0.08)";
const FLOATING_CARD_SHADOW = "rgba(15, 23, 42, 0.12)";
const FLOATING_CARD_SHADOW_OPACITY = 0.35;
const FLOATING_CARD_SHADOW_RADIUS = 30;
const FLOATING_CARD_SHADOW_OFFSET_Y = 18;
const CONTENT_PADDING_HORIZONTAL = 24;
const CONTENT_PADDING_VERTICAL = 30;
const PAGE_PADDING_TOP = 0;
const GRID_GAP = 32;
const LEFT_COLUMN_WIDTH = 0.52;
const RIGHT_COLUMN_WIDTH = 0.48;
const SHOWCASE_CARD_HEIGHT = 260;
const SHOWCASE_CARD_GAP = 36;
const SHOWCASE_ANIMATION_DURATION = 26000;
const SHOWCASE_COLUMN_GAP = 20;
const SHOWCASE_MIN_HEIGHT = 640;
const SHOWCASE_VERTICAL_PADDING = 24;
const SHOWCASE_RADIUS = 24;
const SHOWCASE_BACKGROUND = "rgba(255,255,255,0.7)";
const SHOWCASE_BORDER = "rgba(15, 23, 42, 0.08)";
const SHOWCASE_BORDER_WIDTH = 1;
const SHOWCASE_PADDING = 16;
const SHOWCASE_TITLE_SIZE = 26;
const SHOWCASE_SUBTITLE_SIZE = 16;
const SHOWCASE_SUBTITLE_LINE_HEIGHT = 22;
const SHOWCASE_TITLE_COLOR = "#0F172A";
const SHOWCASE_SUBTITLE_COLOR = "rgba(15, 23, 42, 0.7)";
const SHOWCASE_TITLE = "Creators you can work with";
const SHOWCASE_SUBTITLE = "Live marketplace snapshots, updated continuously.";
const TITLE_TEXT_ALIGN = "center" as const;
const WIDE_LAYOUT_MIN = 980;
const SHOWCASE_SPLIT_INDEX = 3;
const FORM_SUBTITLE_MARGIN = 16;
const INPUT_GAP = 10;
const PRIMARY_BUTTON_MARGIN_TOP = 16;
const BUTTON_RADIUS = 14;
const LOGIN_PROMPT_MARGIN = 18;
const SECONDARY_BUTTON_MARGIN = 8;
const BACK_TEXT_MARGIN = 16;
const SHOWCASE_TEXT_GAP = 16;
const SHOWCASE_CARD_OPACITY = 0.6;
const SHOWCASE_TEXT_BLOCK_HEIGHT = 72;
const SHOWCASE_TITLE_SHADOW = "rgba(255,255,255,0.3)";
const SHOWCASE_TITLE_SHADOW_RADIUS = 10;

const SAMPLE_INFLUENCERS: InfluencerItem[] = [
    {
        id: "influencer-1",
        name: "Mia Alvarez",
        username: "miaalvarez",
        profile_pic:
            "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=240&h=240",
        follower_count: 125000,
        engagement_count: 8200,
        views_count: 242000,
        engagement_rate: 4.3,
        location: "Los Angeles, CA",
        isDiscover: true,
    },
    {
        id: "influencer-2",
        name: "Kai Morgan",
        username: "kaimorgan",
        profile_pic:
            "https://images.unsplash.com/photo-1546539781-2e9c76dfe0ed?auto=format&fit=facearea&w=240&h=240",
        follower_count: 98000,
        engagement_count: 6400,
        views_count: 198000,
        engagement_rate: 3.9,
        location: "Austin, TX",
        isDiscover: true,
    },
    {
        id: "influencer-3",
        name: "Sana Patel",
        username: "sanapatel",
        profile_pic:
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=240&h=240",
        follower_count: 210000,
        engagement_count: 11900,
        views_count: 312000,
        engagement_rate: 5.1,
        location: "New York, NY",
        isDiscover: true,
    },
    {
        id: "influencer-4",
        name: "Noah Park",
        username: "noahpark",
        profile_pic:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=facearea&w=240&h=240",
        follower_count: 76000,
        engagement_count: 5200,
        views_count: 141000,
        engagement_rate: 3.6,
        location: "Seattle, WA",
        isDiscover: true,
    },
    {
        id: "influencer-5",
        name: "Elena Rossi",
        username: "elenarossi",
        profile_pic:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=240&h=240",
        follower_count: 188000,
        engagement_count: 10400,
        views_count: 276000,
        engagement_rate: 4.7,
        location: "Miami, FL",
        isDiscover: true,
    },
    {
        id: "influencer-6",
        name: "Owen Lee",
        username: "owenlee",
        profile_pic:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=240&h=240",
        follower_count: 142000,
        engagement_count: 7600,
        views_count: 224000,
        engagement_rate: 4.0,
        location: "Chicago, IL",
        isDiscover: true,
    },
];

const buildLoop = (items: InfluencerItem[]) => [...items, ...items];

const AutoScrollColumn = ({
    items,
    direction,
}: {
    items: InfluencerItem[];
    direction: 1 | -1;
}) => {
    const loopItems = useMemo(() => buildLoop(items), [items]);
    const translateY = useSharedValue(0);
    const scrollDistance = useMemo(
        () => items.length * (SHOWCASE_CARD_HEIGHT + SHOWCASE_CARD_GAP),
        [items.length]
    );

    useEffect(() => {
        translateY.value = withRepeat(
            withTiming(-direction * scrollDistance, {
                duration: SHOWCASE_ANIMATION_DURATION,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, [direction, scrollDistance, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View style={stylesLocal.showcaseColumn}>
            <Animated.View style={animatedStyle}>
                {loopItems.map((item, index) => (
                    <View key={`${item.id}-${index}`} style={stylesLocal.showcaseCardWrapper}>
                        <InfluencerCard item={item} isCollapsed />
                    </View>
                ))}
            </Animated.View>
        </View>
    );
};

const SignUpScreen = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const router = useRouter();
    const theme = useTheme();
    const styles = fnStyles(theme);
    const { signUp } = useAuthContext();
    const { width } = useWindowDimensions();
    const windowHeight = Dimensions.get("window").height;
    const isWideLayout = width >= WIDE_LAYOUT_MIN;
    const showcaseHeight = Math.max(
        SHOWCASE_MIN_HEIGHT,
        windowHeight - SHOWCASE_VERTICAL_PADDING * 2 - SHOWCASE_TEXT_BLOCK_HEIGHT
    );

    const leftItems = useMemo(
        () => SAMPLE_INFLUENCERS.slice(0, SHOWCASE_SPLIT_INDEX),
        []
    );
    const rightItems = useMemo(
        () => SAMPLE_INFLUENCERS.slice(SHOWCASE_SPLIT_INDEX),
        []
    );

    return (
        <LinearGradient colors={BACKGROUND_GRADIENT} style={stylesLocal.background}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={stylesLocal.flex}
            >
                <View
                    style={[
                        stylesLocal.page,
                        stylesLocal.contentRow,
                        !isWideLayout && stylesLocal.contentColumn,
                    ]}
                >
                    <View
                        style={[
                            stylesLocal.leftPane,
                            !isWideLayout && stylesLocal.leftPaneStacked,
                        ]}
                    >
                        <Text style={stylesLocal.showcaseTitle}>{SHOWCASE_TITLE}</Text>
                        <Text style={stylesLocal.showcaseSubtitle}>{SHOWCASE_SUBTITLE}</Text>
                        <View style={[stylesLocal.showcaseContainer, { height: showcaseHeight }]}>
                            <AutoScrollColumn items={leftItems} direction={1} />
                            <AutoScrollColumn items={rightItems} direction={-1} />
                        </View>
                    </View>
                    <View
                        style={[
                            stylesLocal.rightPane,
                            !isWideLayout && stylesLocal.rightPaneStacked,
                        ]}
                    >
                        <View style={stylesLocal.floatingCard}>
                            <Image
                                source={require("@/assets/images/logo.png")}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={[styles.title, stylesLocal.formTitle]}>
                                Create your brand
                            </Text>
                            <Text style={[styles.subTitle, stylesLocal.formSubtitle]}>
                                Use your work email to create a Trendly brand account
                            </Text>
                            <View style={[styles.inputContainer, stylesLocal.inputStack]}>
                                <TextInput
                                    label="Name"
                                    value={name}
                                    onChangeText={setName}
                                    mode="outlined"
                                    textColor={Colors(theme).text}
                                    placeholderTextColor={Colors(theme).text}
                                    style={styles.input}
                                    theme={{ colors: { primary: Colors(theme).text } }}
                                />
                                <TextInput
                                    autoCapitalize="none"
                                    label="Work Email"
                                    value={email}
                                    placeholderTextColor={Colors(theme).text}
                                    onChangeText={setEmail}
                                    textColor={Colors(theme).text}
                                    mode="outlined"
                                    style={styles.input}
                                    theme={{ colors: { primary: Colors(theme).text } }}
                                />
                                <TextInput
                                    label="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    mode="outlined"
                                    placeholderTextColor={Colors(theme).text}
                                    textColor={Colors(theme).text}
                                    style={styles.input}
                                    theme={{ colors: { primary: Colors(theme).text } }}
                                />
                                <TextInput
                                    label="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholderTextColor={Colors(theme).text}
                                    textColor={Colors(theme).text}
                                    secureTextEntry
                                    mode="outlined"
                                    style={styles.input}
                                    theme={{ colors: { primary: Colors(theme).text } }}
                                />
                                <Button
                                    mode="contained"
                                    style={stylesLocal.primaryButton}
                                    onPress={() => signUp(name, email, password)}
                                >
                                    Create Account
                                </Button>
                            </View>
                            <View style={stylesLocal.loginPrompt}>
                                <Text style={[styles.loginText, stylesLocal.loginText]}>
                                    Already have an account?
                                </Text>
                                <Button
                                    mode="outlined"
                                    style={stylesLocal.secondaryButton}
                                    onPress={() => router.replace("/(auth)/login")}
                                >
                                    Login
                                </Button>
                            </View>
                            <Text style={[styles.loginText, stylesLocal.backText]}>
                                Looking for Social Signup?{" "}
                                <Text style={styles.loginLink} onPress={() => router.back()}>
                                    Go Back
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const stylesLocal = {
    background: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    page: {
        minHeight: Dimensions.get("window").height,
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingTop: PAGE_PADDING_TOP,
        paddingBottom: CONTENT_PADDING_VERTICAL,
    },
    contentRow: {
        flexDirection: "row" as const,
        gap: GRID_GAP,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    contentColumn: {
        flexDirection: "column" as const,
    },
    leftPane: {
        flex: LEFT_COLUMN_WIDTH,
        width: "100%" as const,
        gap: SHOWCASE_TEXT_GAP,
        alignSelf: "flex-start" as const,
    },
    leftPaneStacked: {
        marginBottom: GRID_GAP,
    },
    rightPane: {
        flex: RIGHT_COLUMN_WIDTH,
        width: "100%" as const,
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "flex-start" as const,
    },
    rightPaneStacked: {
        alignItems: "stretch" as const,
    },
    showcaseTitle: {
        color: SHOWCASE_TITLE_COLOR,
        fontSize: SHOWCASE_TITLE_SIZE,
        fontWeight: "700",
        textAlign: TITLE_TEXT_ALIGN,
        textShadowColor: SHOWCASE_TITLE_SHADOW,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: SHOWCASE_TITLE_SHADOW_RADIUS,
    },
    showcaseSubtitle: {
        color: SHOWCASE_SUBTITLE_COLOR,
        fontSize: SHOWCASE_SUBTITLE_SIZE,
        lineHeight: SHOWCASE_SUBTITLE_LINE_HEIGHT,
        textAlign: TITLE_TEXT_ALIGN,
    },
    showcaseContainer: {
        flex: 1,
        flexDirection: "row",
        gap: SHOWCASE_COLUMN_GAP,
        padding: SHOWCASE_PADDING,
        borderRadius: SHOWCASE_RADIUS,
        backgroundColor: SHOWCASE_BACKGROUND,
        borderWidth: SHOWCASE_BORDER_WIDTH,
        borderColor: SHOWCASE_BORDER,
        overflow: "hidden",
    },
    showcaseColumn: {
        flex: 1,
        overflow: "hidden" as const,
    },
    showcaseCardWrapper: {
        height: SHOWCASE_CARD_HEIGHT,
        marginBottom: SHOWCASE_CARD_GAP,
        opacity: SHOWCASE_CARD_OPACITY,
    },
    floatingCard: {
        width: "100%" as const,
        maxWidth: FLOATING_CARD_MAX_WIDTH,
        alignSelf: "center" as const,
        backgroundColor: FLOATING_CARD_BACKGROUND,
        borderRadius: FLOATING_CARD_RADIUS,
        padding: FLOATING_CARD_PADDING,
        borderWidth: FLOATING_CARD_BORDER,
        borderColor: FLOATING_CARD_BORDER_COLOR,
        shadowColor: FLOATING_CARD_SHADOW,
        shadowOpacity: FLOATING_CARD_SHADOW_OPACITY,
        shadowRadius: FLOATING_CARD_SHADOW_RADIUS,
        shadowOffset: { width: 0, height: FLOATING_CARD_SHADOW_OFFSET_Y },
    },
    formTitle: {
        textAlign: "center" as const,
    },
    formSubtitle: {
        textAlign: "center" as const,
        opacity: 0.8,
        marginBottom: FORM_SUBTITLE_MARGIN,
    },
    inputStack: {
        gap: INPUT_GAP,
    },
    primaryButton: {
        marginTop: PRIMARY_BUTTON_MARGIN_TOP,
        borderRadius: BUTTON_RADIUS,
    },
    loginPrompt: {
        marginTop: LOGIN_PROMPT_MARGIN,
        alignItems: "center" as const,
    },
    loginText: {
        opacity: 0.8,
    },
    secondaryButton: {
        marginTop: SECONDARY_BUTTON_MARGIN,
        borderRadius: BUTTON_RADIUS,
    },
    backText: {
        opacity: 0.7,
        marginTop: BACK_TEXT_MARGIN,
        textAlign: "center" as const,
    },
} as const;

export default SignUpScreen;
