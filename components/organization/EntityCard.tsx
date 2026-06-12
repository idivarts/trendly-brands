import { Text, View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";

interface EntityCardProps {
    title: string;
    subtitle?: string;
    /** Primary action — tapping anywhere on the card triggers this. */
    onPress?: () => void;
    /** Right-aligned content: a chip, kebab overflow, etc. */
    trailing?: React.ReactNode;
}

/**
 * One list-card pattern shared by the Organizations hub (org rows) and the
 * manage screen (brand rows). Affordance is consistent everywhere: tapping the
 * card runs the primary action, and `trailing` holds the chip / overflow menu.
 */
const EntityCard: React.FC<EntityCardProps> = ({ title, subtitle, onPress, trailing }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const body = (
        <>
            <View style={styles.info} lightColor="transparent" darkColor="transparent">
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
                {!!subtitle && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {!!trailing && (
                <View
                    style={styles.trailing}
                    lightColor="transparent"
                    darkColor="transparent"
                    // Capture touches that start on the trailing actions so they
                    // don't bubble up and trigger the card's primary onPress.
                    onStartShouldSetResponder={() => true}
                >
                    {trailing}
                </View>
            )}
        </>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
                {body}
            </Pressable>
        );
    }
    return <View style={styles.card}>{body}</View>;
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        card: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            backgroundColor: colors.card,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            minHeight: 56,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        cardPressed: {
            opacity: 0.85,
        },
        info: {
            flex: 1,
            minWidth: 0,
        },
        title: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
        },
        subtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
        },
        trailing: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
        },
    });

export default EntityCard;
