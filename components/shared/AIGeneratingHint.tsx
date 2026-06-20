import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// ─── AIGeneratingHint ─────────────────────────────────────────────────────────
// A small, NON-blocking in-flight banner shown inline next to whatever field is
// being generated (image, caption, hashtags, …). The prompt surface hands the
// request off to the parent and closes immediately; this is the reassurance that
// work is happening and the user is free to keep editing everything else.
//
// Keep this the single source of truth for the "generating" look so every AI
// surface on the content editor reads identically.

interface AIGeneratingHintProps {
    title: string;
    /** Defaults to the standard "keep working" reassurance. */
    subtitle?: string;
}

const DEFAULT_SUB =
    "You can keep working — it'll appear here automatically when it's ready.";

const AIGeneratingHint: React.FC<AIGeneratingHintProps> = ({
    title,
    subtitle = DEFAULT_SUB,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <View style={styles.box}>
            <ActivityIndicator size="small" color={colors.primary} />
            <View style={styles.textWrap}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        box: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        textWrap: {
            flex: 1,
            minWidth: 0,
        },
        title: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 2,
        },
        sub: {
            fontSize: 11,
            color: colors.textSecondary,
            lineHeight: 16,
        },
    });
}

export default AIGeneratingHint;
