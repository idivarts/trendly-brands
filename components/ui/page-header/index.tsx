import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    /** Show back button. On mobile (!xl), defaults to true unless explicitly false. */
    showBackButton?: boolean;
    onBackPress?: () => void;
    actionButtons?: React.ReactNode[];
    rightComponent?: React.ReactNode;
    /** On mobile, hide action buttons/rightComponent except when explicitly allowed */
    mobileActions?: "none" | "notification-only" | "all";
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    showBackButton,
    onBackPress,
    actionButtons = [],
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
    const hasRightComponent = Boolean(rightComponent);

    return (
        <View style={styles.header}>
            {showBack && (
                <Pressable onPress={handleBack} style={styles.headerBack}>
                    <FontAwesomeIcon
                        icon={faArrowLeft}
                        size={20}
                        color={colors.text}
                    />
                </Pressable>
            )}
            <View style={styles.headerTitleBlock}>
                <Text style={styles.headerTitle}>{title}</Text>
                {subtitle ? (
                    <Text style={styles.headerSubtitle}>{subtitle}</Text>
                ) : null}
            </View>
            {showActions && (hasActionButtons || hasRightComponent) && (
                <View style={styles.headerActions}>
                    {hasActionButtons && actionButtons}
                    {hasRightComponent && rightComponent}
                </View>
            )}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, topInset: number, xl: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingTop: xl ? 12 + topInset : topInset,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: colors.background,
                },
                headerBack: {
                    padding: 8,
                    marginRight: 8,
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
                    gap: 12,
                    flexShrink: 0,
                },
            }),
        [colors, topInset, xl]
    );
}

export default PageHeader;
