import PublicCalendarView from "@/components/sharing/public/PublicCalendarView";
import PublicContentView from "@/components/sharing/public/PublicContentView";
import PublicShareChrome from "@/components/sharing/public/PublicShareChrome";
import PublicStrategyView from "@/components/sharing/public/PublicStrategyView";
import { usePublicShare } from "@/hooks/use-public-share";
import { Text, View } from "@/shared-uis/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

const SharePage = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { token } = useLocalSearchParams<{ token: string }>();

    const { status, share, tier, viewerId, viewerName } = usePublicShare(token);

    if (status === "loading") {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    }

    if (status === "notfound" || !share) {
        return (
            <View style={styles.center}>
                <Text style={styles.title}>Link unavailable</Text>
                <Text style={styles.subtitle}>
                    This share link is invalid or has been turned off by its owner.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <PublicShareChrome tier={tier} viewerName={viewerName} share={share} />
            {share.type === "strategy" && (
                <PublicStrategyView
                    share={share}
                    tier={tier}
                    viewerId={viewerId}
                    viewerName={viewerName}
                />
            )}
            {share.type === "content" && (
                <PublicContentView
                    share={share}
                    tier={tier}
                    viewerId={viewerId}
                    viewerName={viewerName}
                />
            )}
            {share.type === "calendarMonth" && <PublicCalendarView share={share} />}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.background,
        },
        center: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 8,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
            maxWidth: 360,
        },
    });
}

export default SharePage;
