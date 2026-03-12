import type { InfluencerItem } from "@/components/discover/discover-types";
import InfluencerCard from "@/components/explore-influencers/InfluencerCard";
import { useBreakpoints } from "@/hooks";
import { getConstrainedHeight } from "@/shared-libs/contexts/mobile-layout-context.provider";
import Colors from "@/shared-uis/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const FLOATING_CARD_MAX_WIDTH = 460;
const FLOATING_CARD_RADIUS = 24;
const FLOATING_CARD_PADDING = 12;
const FLOATING_CARD_BORDER = 1;
const CONTENT_PADDING_HORIZONTAL = 24;
const CONTENT_PADDING_VERTICAL = 30;
const PAGE_PADDING_TOP = 0;
const GRID_GAP = 32;
const LEFT_COLUMN_WIDTH = 0.52;
const RIGHT_COLUMN_WIDTH = 0.48;
const SHOWCASE_CARD_HEIGHT = 260;
const SHOWCASE_CARD_GAP = 60;
const SHOWCASE_ANIMATION_DURATION = 26000;
const SHOWCASE_COLUMN_GAP = 20;
const SHOWCASE_MIN_HEIGHT = 640;
const SHOWCASE_VERTICAL_PADDING = 24;
const SHOWCASE_RADIUS = 24;
const SHOWCASE_PADDING = 16;
const SHOWCASE_TITLE_SIZE = 26;
const SHOWCASE_SUBTITLE_SIZE = 16;
const SHOWCASE_SUBTITLE_LINE_HEIGHT = 22;
const SHOWCASE_TITLE = "Creators you can work with";
const SHOWCASE_SUBTITLE = "Live marketplace snapshots, updated continuously.";
const TITLE_TEXT_ALIGN = "center" as const;
const WIDE_LAYOUT_MIN = 980;
const SHOWCASE_SPLIT_INDEX = 3;
const SHOWCASE_TEXT_GAP = 16;
const SHOWCASE_CARD_OPACITY = 0.6;
const SHOWCASE_TEXT_BLOCK_HEIGHT = 72;
const RIGHT_PANE_TOP_OFFSET = 24;
const SHOWCASE_TITLE_SHADOW_RADIUS = 10;
const FLOATING_CARD_SHADOW_OPACITY = 0.35;
const FLOATING_CARD_SHADOW_RADIUS = 30;
const FLOATING_CARD_SHADOW_OFFSET_Y = 18;
const SHOWCASE_BORDER_WIDTH = 1;

export const FORM_SUBTITLE_MARGIN = 10;
export const INPUT_GAP = 8;
export const PRIMARY_BUTTON_MARGIN_TOP = 12;
export const BUTTON_RADIUS = 14;
export const LOGIN_PROMPT_MARGIN = 12;
export const SECONDARY_BUTTON_MARGIN = 6;
export const BACK_TEXT_MARGIN = 10;

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

/** Duplicate items so that when we scroll, duplicated content fills any gap (no white space). */
const buildLoop = (items: InfluencerItem[]) => [...items, ...items, ...items];

const AutoScrollColumn = ({
    items,
    direction,
}: {
    items: InfluencerItem[];
    direction: 1 | -1;
}) => {
    const loopItems = useMemo(() => buildLoop(items), [items]);
    const scrollDistance = useMemo(
        () => items.length * (SHOWCASE_CARD_HEIGHT + SHOWCASE_CARD_GAP),
        [items.length]
    );
    // direction -1 = scroll downward: start one segment down so content above viewport (no white at top).
    const initialY = direction === -1 ? -scrollDistance : 0;
    const translateY = useSharedValue(initialY);

    useEffect(() => {
        if (direction === -1) {
            // Downward scroll: animate from -scrollDistance to 0 (content moves up), then reset to -scrollDistance (seamless)
            translateY.value = withRepeat(
                withSequence(
                    withTiming(0, {
                        duration: SHOWCASE_ANIMATION_DURATION,
                        easing: Easing.linear,
                    }),
                    withTiming(-scrollDistance, { duration: 0 })
                ),
                -1
            );
        } else {
            // Upward scroll: original behavior – animate from 0 to -scrollDistance, then reset to 0
            translateY.value = withRepeat(
                withSequence(
                    withTiming(-scrollDistance, {
                        duration: SHOWCASE_ANIMATION_DURATION,
                        easing: Easing.linear,
                    }),
                    withTiming(0, { duration: 0 })
                ),
                -1
            );
        }
    }, [direction, scrollDistance, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return Platform.OS === "web" ? (
        <View style={authLayoutStyles.showcaseColumn}>
            <Animated.View style={animatedStyle}>
                {loopItems.map((item, index) => (
                    <View
                        key={`${item.id}-${index}`}
                        style={authLayoutStyles.showcaseCardWrapper}
                    >
                        <InfluencerCard item={item} isCollapsed />
                    </View>
                ))}
            </Animated.View>
        </View>
    ) : null;
}; 

const AuthPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { width, height: windowHeight } = useBreakpoints();
    const isWideLayout = width >= WIDE_LAYOUT_MIN;
    const showcaseHeight = Math.max(
        SHOWCASE_MIN_HEIGHT,
        windowHeight - SHOWCASE_VERTICAL_PADDING * 2 - SHOWCASE_TEXT_BLOCK_HEIGHT
    );

    const gradientColors = useMemo<readonly [string, string, string]>(
        () => [colors.authGradient1, colors.authGradient2, colors.authGradient3],
        [colors]
    );

    const stylesWithTheme = useMemo(
        () => ({
            ...authLayoutStyles,
            showcaseTitle: {
                ...authLayoutStyles.showcaseTitle,
                color: colors.showcaseTitleColor,
                textShadowColor: colors.showcaseTitleShadow,
            },
            showcaseSubtitle: {
                ...authLayoutStyles.showcaseSubtitle,
                color: colors.showcaseSubtitleColor,
            },
            showcaseContainer: {
                ...authLayoutStyles.showcaseContainer,
                backgroundColor: colors.showcaseBg,
                borderColor: colors.showcaseBorder,
            },
            floatingCard: {
                ...authLayoutStyles.floatingCard,
                backgroundColor: colors.floatingCardBg,
                borderColor: colors.floatingCardBorder,
                shadowColor: colors.floatingCardShadow,
            },
        }),
        [colors]
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
        <LinearGradient colors={gradientColors} style={stylesWithTheme.background}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={stylesWithTheme.flex}
            >
                <View
                    style={[
                        stylesWithTheme.page,
                        stylesWithTheme.contentRow,
                        !isWideLayout && stylesWithTheme.contentColumn,
                        isWideLayout && {
                            maxHeight:
                                windowHeight -
                                PAGE_PADDING_TOP -
                                CONTENT_PADDING_VERTICAL * 2 -
                                16,
                        },
                    ]}
                >
                    {isWideLayout && (
                        <View
                            style={[
                                stylesWithTheme.leftPane,
                                !isWideLayout && stylesWithTheme.leftPaneStacked,
                            ]}
                        >
                            <Text style={stylesWithTheme.showcaseTitle}>{SHOWCASE_TITLE}</Text>
                            <Text style={stylesWithTheme.showcaseSubtitle}>{SHOWCASE_SUBTITLE}</Text>
                            <View style={[stylesWithTheme.showcaseContainer, { height: showcaseHeight }]}>
                                <AutoScrollColumn items={rightItems} direction={-1} />
                                <AutoScrollColumn items={leftItems} direction={1} />
                            </View>
                        </View>
                    )}
                    <View
                        style={[
                            stylesWithTheme.rightPane,
                            !isWideLayout && stylesWithTheme.rightPaneStacked,
                            isWideLayout && { paddingTop: RIGHT_PANE_TOP_OFFSET },
                            isWideLayout && { minHeight: 0, alignSelf: "center" as const },
                            {
                                maxHeight:
                                    windowHeight -
                                    CONTENT_PADDING_VERTICAL * 2 -
                                    (isWideLayout ? RIGHT_PANE_TOP_OFFSET : 0) -
                                    16,
                            },
                        ]}
                    >
                        <View
                            style={[
                                stylesWithTheme.floatingCard,
                                authLayoutStyles.floatingCardConstrain,
                            ]}
                        >
                            <ScrollView
                                style={authLayoutStyles.floatingCardScroll}
                                contentContainerStyle={authLayoutStyles.floatingCardScrollContent}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                {children}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

export const authLayoutStyles = {
    background: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    page: {
        minHeight: getConstrainedHeight(),
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
        justifyContent: "flex-start" as const,
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
        flexDirection: "column" as const,
    },
    rightPaneStacked: {
        alignItems: "stretch" as const,
    },
    showcaseTitle: {
        fontSize: SHOWCASE_TITLE_SIZE,
        fontWeight: "700",
        textAlign: TITLE_TEXT_ALIGN,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: SHOWCASE_TITLE_SHADOW_RADIUS,
    },
    showcaseSubtitle: {
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
        borderWidth: SHOWCASE_BORDER_WIDTH,
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
        borderRadius: FLOATING_CARD_RADIUS,
        padding: FLOATING_CARD_PADDING,
        borderWidth: FLOATING_CARD_BORDER,
        shadowOpacity: FLOATING_CARD_SHADOW_OPACITY,
        shadowRadius: FLOATING_CARD_SHADOW_RADIUS,
        shadowOffset: { width: 0, height: FLOATING_CARD_SHADOW_OFFSET_Y },
    },
    /** When right pane is height-constrained, card fills it and content scrolls (avoids bottom cut-off on smaller windows) */
    floatingCardConstrain: {
        flex: 1,
        minHeight: 0,
        overflow: "hidden" as const,
    },
    floatingCardScroll: {
        flex: 1,
    },
    floatingCardScrollContent: {
        flexGrow: 1,
    },
    formTitle: {
        textAlign: "center" as const,
    },
    formSubtitle: {
        textAlign: "center" as const,
        opacity: 0.8,
        marginBottom: FORM_SUBTITLE_MARGIN,
    },
    formHeader: {
        minHeight: 72,
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
    forgotPassword: {
        // marginTop: 4,
        textAlign: "center" as const,
    },
    backText: {
        opacity: 0.7,
        marginTop: BACK_TEXT_MARGIN,
        textAlign: "center" as const,
    },
} as const;

export default AuthPageLayout;
