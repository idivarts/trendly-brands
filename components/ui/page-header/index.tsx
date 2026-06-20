import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Colors from "@/shared-uis/constants/Colors";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface PageHeaderProps {
    customMainContent?: React.ReactNode;
    title: string;
    subtitle?: string;
    /** Show back button. On mobile (!xl), defaults to true unless explicitly false. */
    showBackButton?: boolean;
    onBackPress?: () => void;
    /**
     * Generic action buttons rendered on the right (legacy single-group API).
     * For two-group split with divider/second-row behavior, use
     * viewingActionButtons + workflowActionButtons instead.
     */
    actionButtons?: React.ReactNode[];
    /**
     * Lightweight, navigation-oriented buttons (presence, comments, chat
     * toggles). On xl, render on the right before the divider. On !xl,
     * stay on the right of the header row.
     */
    viewingActionButtons?: React.ReactNode[];
    /**
     * High-stakes workflow buttons (Send for Review, New Strategy, etc.).
     * On xl, render on the right after the divider. On !xl, drop to a
     * second row below the header.
     */
    workflowActionButtons?: React.ReactNode[];
    /**
     * Rendered on the left, immediately after the back button (if any)
     * and before the title. Use for sibling-document switchers like a
     * hamburger that opens a list drawer.
     */
    leftAction?: React.ReactNode;
    rightComponent?: React.ReactNode;
    /** On mobile, hide action buttons/rightComponent except when explicitly allowed */
    mobileActions?: "none" | "notification-only" | "all";
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    customMainContent,
    showBackButton,
    onBackPress,
    actionButtons = [],
    viewingActionButtons = [],
    workflowActionButtons = [],
    leftAction,
    rightComponent,
    mobileActions = "none",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const router = useRouter();
    const nav = useMyNavigation();
    const insets = useSafeAreaInsets();
    const styles = useStyles(colors, insets.top, xl);

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else if (router.canGoBack()) {
            router.back();
        } else {
            nav.resetAndNavigate("/discover");
        }
    };

    // On mobile, show back button by default unless explicitly disabled
    const showBack =
        showBackButton === true || (showBackButton !== false && !xl);
    const showActions =
        xl ||
        mobileActions === "all" ||
        (mobileActions === "notification-only" && rightComponent);

    const hasActionButtons = actionButtons && actionButtons.length > 0;
    const hasViewingButtons = viewingActionButtons && viewingActionButtons.length > 0;
    const hasWorkflowButtons = workflowActionButtons && workflowActionButtons.length > 0;
    const hasRightComponent = Boolean(rightComponent);
    const hasSplitButtons = hasViewingButtons || hasWorkflowButtons;
    // Workflow actions render inline next to viewing actions, separated by a
    // divider on xl. On !xl they sit flush (screens are expected to render
    // them as icon-only to fit). Screens with too many actions to fit
    // comfortably should host workflow buttons elsewhere (e.g. a toolbar
    // row), not pass them here.
    const showWorkflowInline = hasWorkflowButtons;

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.headerRow}>
                {showBack && (
                    <Pressable onPress={handleBack} style={styles.headerBack}>
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            size={20}
                            color={colors.text}
                        />
                    </Pressable>
                )}
                {leftAction ? (
                    <View style={styles.headerLeftAction}>{leftAction}</View>
                ) : null}
                {customMainContent ? customMainContent :
                    <View style={styles.headerTitleBlock}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        {subtitle && xl ? (
                            <Text style={styles.headerSubtitle}>{subtitle}</Text>
                        ) : null}
                    </View>}
                {showActions && (hasActionButtons || hasSplitButtons || hasRightComponent) && (
                    <View style={styles.headerActions}>
                        {hasActionButtons && actionButtons.map((btn, index) => (
                            <React.Fragment key={`a-${index}`}>{btn}</React.Fragment>
                        ))}
                        {hasViewingButtons && viewingActionButtons.map((btn, index) => (
                            <React.Fragment key={`v-${index}`}>{btn}</React.Fragment>
                        ))}
                        {showWorkflowInline && hasViewingButtons && xl && (
                            <View style={styles.headerDivider} />
                        )}
                        {showWorkflowInline && workflowActionButtons.map((btn, index) => (
                            <React.Fragment key={`w-${index}`}>{btn}</React.Fragment>
                        ))}
                        {hasRightComponent && rightComponent}
                    </View>
                )}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, topInset: number, xl: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                headerWrapper: {
                    // Shadow + background live on the wrapper so the second
                    // row (mobile workflow actions) sits inside the elevated
                    // surface instead of below it.
                    shadowColor: colors.panelShadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.6,
                    elevation: 2,
                    zIndex: 5,
                    overflow: "visible",
                    backgroundColor: colors.background,
                },
                headerRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: xl ? 16 : 12,
                    paddingTop: 12 + topInset,
                    paddingBottom: 12,
                },
                headerBack: {
                    padding: xl ? 8 : 6,
                    marginRight: xl ? 8 : 4,
                },
                headerLeftAction: {
                    marginRight: 12,
                    flexShrink: 0,
                },
                headerTitleBlock: {
                    flex: 1,
                    flexShrink: 1,
                    minWidth: 0,
                },
                headerTitle: {
                    fontSize: 22,
                    fontWeight: "700",
                    color: colors.text,
                },
                headerSubtitle: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginTop: 2,
                    letterSpacing: 1,
                },
                headerActions: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: xl ? 12 : 6,
                    flexShrink: 0,
                },
                headerDivider: {
                    width: 1,
                    height: 24,
                    backgroundColor: colors.border,
                    marginHorizontal: 4,
                },
            }),
        [colors, topInset, xl]
    );
}

export default PageHeader;
