import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const WHY_COMPLETE_HEADING = "WHY COMPLETE YOUR PROFILE?";
const WHY_COMPLETE_BODY =
    "Brands with complete details see 4x more creator engagement. Providing accurate industry and age information helps our AI match you with the most relevant influencers.";

const WhyCompleteProfileBlock: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(
        () => createStyles(colors),
        [colors]
    );

    return (
        <View style={styles.block}>
            <Text style={styles.heading}>{WHY_COMPLETE_HEADING}</Text>
            <Text style={styles.body}>{WHY_COMPLETE_BODY}</Text>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        block: {
            padding: 24,
            borderRadius: 16,
            backgroundColor: colors.primaryLight,
            borderWidth: 1,
            borderColor: colors.reasonsBoxBorder,
            marginTop: 48,
        },
        heading: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.primary,
            letterSpacing: 1.5,
            marginBottom: 8,
            textTransform: "uppercase",
        },
        body: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 22,
        },
    });
}

export default WhyCompleteProfileBlock;
