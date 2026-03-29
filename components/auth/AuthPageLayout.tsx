import {
    AUTH_SHOWCASE_MARQUEE_SPLIT_INDEX,
    authShowcaseSampleInfluencers,
} from "@/components/auth/auth-showcase-sample-influencers";
import type { InfluencerItem } from "@/components/discover/discover-types";
import InfluencerCard from "@/components/explore-influencers/InfluencerCard";
import { useBreakpoints } from "@/hooks";
import { getConstrainedHeight } from "@/shared-libs/contexts/mobile-layout-context.provider";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Must match `showcaseCardWrapper` height + gap so the scroll loop stays seamless. */
const marqueeCard = { height: 260, gap: 60 } as const;
const marqueeScrollDurationMs = 26_000;

/** Viewport height below this uses compact spacing so the form fits without scrolling. */
export const SHORT_VIEWPORT_MAX_HEIGHT = 920;

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
        () => items.length * (marqueeCard.height + marqueeCard.gap),
        [items.length]
    );
    // direction -1 = scroll downward: start one segment down so content above viewport (no white at top).
    const initialY = direction === -1 ? -scrollDistance : 0;
    const translateY = useSharedValue(initialY);

    useEffect(() => {
        const towardY = direction === -1 ? 0 : -scrollDistance;
        const resetY = direction === -1 ? -scrollDistance : 0;
        translateY.value = withRepeat(
            withSequence(
                withTiming(towardY, {
                    duration: marqueeScrollDurationMs,
                    easing: Easing.linear,
                }),
                withTiming(resetY, { duration: 0 })
            ),
            -1
        );
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
    const insets = useSafeAreaInsets();
    const { width, height: windowHeight } = useBreakpoints();
    const isWideLayout = width >= 980;
    const narrowPagePaddingTop = Math.max(30, insets.top);
    const narrowPagePaddingBottom = Math.max(30, insets.bottom);
    const narrowMaxHeight =
        windowHeight - narrowPagePaddingTop - narrowPagePaddingBottom;
    const showcaseHeight = Math.max(640, windowHeight - 24 * 2);

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
                // backgroundColor: colors.showcaseBg,
                // borderColor: colors.showcaseBorder,
            },
            floatingCard: {
                ...authLayoutStyles.floatingCard,
                backgroundColor: colors.floatingCardBg,
                borderColor: colors.floatingCardBorder,
                shadowColor: colors.floatingCardShadow,
            },
            /** Narrow layout: form sits on the gradient full-bleed (no elevated card). */
            floatingCardFullBleed: {
                width: "100%" as const,
                alignSelf: "stretch" as const,
                borderRadius: 0,
                borderWidth: 0,
                paddingHorizontal: 0,
                paddingVertical: 0,
                backgroundColor: colors.transparent,
                borderColor: colors.transparent,
                shadowColor: colors.transparent,
                shadowOpacity: 0,
                shadowRadius: 0,
                shadowOffset: { width: 0, height: 0 },
            },
            pageNarrow: {
                paddingHorizontal: 16,
            },
            floatingCardScrollContentNarrow: {
                flexGrow: 1,
                paddingBottom: 32,
            },
            leftPaneShortViewport:
                isWideLayout && windowHeight < SHORT_VIEWPORT_MAX_HEIGHT
                    ? { flex: 0.58 }
                    : null,
            rightPaneShortViewport:
                isWideLayout && windowHeight < SHORT_VIEWPORT_MAX_HEIGHT
                    ? { flex: 0.42 }
                    : null,
            showcaseTextOverlayPill: {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 14,
                width: "88%" as const,
                maxWidth: width * 0.52 * 0.92,
                alignItems: "center" as const,
                gap: 16,
            },
            showcaseOverlayTitle: {
                ...authLayoutStyles.showcaseTitle,
                color: colors.text,
                textShadowRadius: 0,
                textShadowOffset: { width: 0, height: 0 },
            },
            showcaseOverlaySubtitle: {
                ...authLayoutStyles.showcaseSubtitle,
                color: colors.textSecondary,
            },
        }),
        [colors, isWideLayout, width]
    );

    const leftItems = useMemo(
        () =>
            authShowcaseSampleInfluencers.slice(0, AUTH_SHOWCASE_MARQUEE_SPLIT_INDEX),
        []
    );
    const rightItems = useMemo(
        () =>
            authShowcaseSampleInfluencers.slice(AUTH_SHOWCASE_MARQUEE_SPLIT_INDEX),
        []
    );

    const pageContent = (
        <>
            {isWideLayout && (
                <View
                    style={[
                        stylesWithTheme.leftPane,
                        stylesWithTheme.leftPaneShortViewport,
                    ]}
                >
                    <View style={authLayoutStyles.showcaseMarqueeWrapper}>
                        <View
                            style={[stylesWithTheme.showcaseContainer, { height: showcaseHeight }]}
                        >
                            <AutoScrollColumn items={rightItems} direction={-1} />
                            <AutoScrollColumn items={leftItems} direction={1} />
                        </View>
                        <View
                            style={authLayoutStyles.showcaseTextOverlay}
                            pointerEvents="box-none"
                        >
                            <View style={stylesWithTheme.showcaseTextOverlayPill}>
                                <Text style={stylesWithTheme.showcaseOverlayTitle}>
                                    Creators you can work with
                                </Text>
                                <Text style={stylesWithTheme.showcaseOverlaySubtitle}>
                                    Live marketplace snapshots, updated continuously.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
            <View
                style={[
                    stylesWithTheme.rightPane,
                    stylesWithTheme.rightPaneShortViewport,
                    !isWideLayout && stylesWithTheme.rightPaneStacked,
                    !isWideLayout && {
                        flex: 1,
                        maxHeight: narrowMaxHeight,
                        minHeight: 0,
                    },
                    isWideLayout && { paddingTop: 24 },
                    isWideLayout && { minHeight: 0, alignSelf: "center" as const },
                    isWideLayout && {
                        maxHeight: windowHeight - 30 * 2 - 24 - 16,
                    },
                ]}
            >
                <View
                    style={[
                        isWideLayout
                            ? stylesWithTheme.floatingCard
                            : stylesWithTheme.floatingCardFullBleed,
                        authLayoutStyles.floatingCardConstrain,
                    ]}
                >
                    <ScrollView
                        style={authLayoutStyles.floatingCardScroll}
                        contentContainerStyle={[
                            authLayoutStyles.floatingCardScrollContent,
                            !isWideLayout && stylesWithTheme.floatingCardScrollContentNarrow,
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {children}
                    </ScrollView>
                </View>
            </View>
        </>
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
                        isWideLayout
                            ? stylesWithTheme.contentRow
                            : stylesWithTheme.contentColumn,
                        !isWideLayout && stylesWithTheme.flex,
                        !isWideLayout && stylesWithTheme.pageNarrow,
                        isWideLayout
                            ? { maxHeight: windowHeight - 30 * 2 - 16 }
                            : {
                                paddingTop: narrowPagePaddingTop,
                                paddingBottom: narrowPagePaddingBottom,
                            },
                    ]}
                >
                    {pageContent}
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
        paddingHorizontal: 24,
        paddingTop: 0,
        paddingBottom: 30,
    },
    contentRow: {
        flexDirection: "row" as const,
        gap: 32,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    contentColumn: {
        flexDirection: "column" as const,
        justifyContent: "flex-start" as const,
    },
    leftPane: {
        flex: 0.52,
        width: "100%" as const,
        alignSelf: "flex-start" as const,
    },
    rightPane: {
        flex: 0.48,
        width: "100%" as const,
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "flex-start" as const,
        flexDirection: "column" as const,
    },
    rightPaneStacked: {
        alignItems: "stretch" as const,
    },
    rightPaneNarrow: {
        flex: 0,
        maxHeight: undefined,
    },
    showcaseTitle: {
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center" as const,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 10,
    },
    showcaseSubtitle: {
        fontSize: 16,
        lineHeight: 22,
        textAlign: "center" as const,
    },
    showcaseMarqueeWrapper: {
        position: "relative" as const,
        width: "100%" as const,
        alignSelf: "stretch" as const,
    },
    showcaseTextOverlay: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingHorizontal: 16,
    },
    showcaseContainer: {
        flex: 1,
        flexDirection: "row",
        gap: 20,
        // padding: 16,
        // borderRadius: 24,
        // borderWidth: 1,
        overflow: "hidden",
    },
    showcaseColumn: {
        flex: 1,
        overflow: "hidden" as const,
    },
    showcaseCardWrapper: {
        height: marqueeCard.height,
        marginBottom: marqueeCard.gap,
        opacity: 0.6,
    },
    floatingCard: {
        width: "100%" as const,
        maxWidth: 460,
        alignSelf: "center" as const,
        borderRadius: 24,
        padding: 12,
        borderWidth: 1,
        shadowOpacity: 0.35,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 18 },
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
        marginBottom: 10,
    },
    formHeader: {
        minHeight: 72,
    },
    inputStack: {
        gap: 8,
    },
    primaryButton: {
        marginTop: 12,
        borderRadius: 14,
    },
    loginPrompt: {
        marginTop: 12,
        alignItems: "center" as const,
    },
    loginText: {
        opacity: 0.8,
    },
    secondaryButton: {
        marginTop: 6,
        borderRadius: 14,
    },
    forgotPassword: {
        // marginTop: 4,
        textAlign: "center" as const,
    },
    backText: {
        opacity: 0.7,
        marginTop: 10,
        textAlign: "center" as const,
    },
} as const;

export default AuthPageLayout;
