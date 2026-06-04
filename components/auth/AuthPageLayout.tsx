import AuthShowcase from "@/components/auth/AuthShowcase";
import { useBreakpoints } from "@/hooks";
import { getConstrainedHeight } from "@/shared-libs/contexts/mobile-layout-context.provider";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Viewport height below this uses compact spacing so the form fits without scrolling. */
export const SHORT_VIEWPORT_MAX_HEIGHT = 920;

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

    // Soft, neutral light wash (replaces the old pastel gradient). Keeps the
    // dark studio showcase and the white form card both reading cleanly, and
    // stays legible for the full-bleed form on narrow/native layouts.
    const gradientColors = useMemo<readonly [string, string, string]>(
        () => [colors.background, colors.aliceBlue, colors.background],
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
        }),
        [colors, isWideLayout, windowHeight]
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
                    <AuthShowcase />
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
        height: "100vh" as any,
        alignSelf: "stretch" as const,
    },
    showcaseTextOverlay: {
        position: "absolute" as const,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        justifyContent: "flex-end" as const,
        alignItems: "stretch" as const,
        paddingHorizontal: 12,
        paddingBottom: 12,
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
        height: 260,
        marginBottom: 60,
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
        paddingVertical: 16,
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
