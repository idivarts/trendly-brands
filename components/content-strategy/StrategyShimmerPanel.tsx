import Shimmer from "@/shared-uis/components/shimmer";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const StrategyShimmerPanel: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Creating your strategy...</Text>
            <View style={styles.shimmerStack}>
                <Shimmer width="100%" height={28} />
                <Shimmer width="80%" height={16} />
                <Shimmer width="100%" height={16} />
                <Shimmer width="90%" height={16} />
                <Shimmer width="60%" height={16} />
                <View style={styles.gap} />
                <Shimmer width="70%" height={20} />
                <Shimmer width="100%" height={14} />
                <Shimmer width="95%" height={14} />
                <Shimmer width="88%" height={14} />
                <Shimmer width="75%" height={14} />
                <View style={styles.gap} />
                <Shimmer width="65%" height={20} />
                <Shimmer width="100%" height={14} />
                <Shimmer width="82%" height={14} />
                <Shimmer width="91%" height={14} />
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    padding: 24,
                    borderRightWidth: 1,
                    borderRightColor: colors.border,
                },
                label: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 20,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                },
                shimmerStack: {
                    gap: 10,
                },
                gap: {
                    height: 8,
                },
            }),
        [colors]
    );
}

export default StrategyShimmerPanel;
