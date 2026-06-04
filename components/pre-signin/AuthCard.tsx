import AuthOptions from "@/components/pre-signin/AuthOptions";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const TITLE = "Get Started with Trendly";
const SUBTITLE = "Plan, create, and manage your brand's social content in one calm space.";

/**
 * The auth surface (title + subtitle + provider buttons). Rendered centered on
 * the /pre-signin route, and as a floating modal on the lets-start AI page.
 * Pass `onClose` to show a dismiss affordance (modal usage).
 */
const AuthCard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { width } = useBreakpoints();
    const compact = width < 400;
    const cardWidth = Math.min(460, width - 40);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        // <View style={[styles.card, { width: cardWidth, padding: compact ? 24 : 32 }]}>
        //     {!!onClose && (
        //         <Pressable
        //             onPress={onClose}
        //             accessibilityRole="button"
        //             accessibilityLabel="Close"
        //             style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
        //             hitSlop={8}
        //         >
        //             <Ionicons name="close" size={20} color={colors.text} />
        //         </Pressable>
        //     )}
        // {/* </View> */ }
        <View style={{ padding: 24, alignItems: "stretch", width: "100%" }}>

            <Text style={[styles.title, { fontSize: compact ? 24 : 28 }]}>{TITLE}</Text>
            <Text style={styles.subtitle}>{SUBTITLE}</Text>

            <View style={styles.options}>
                <AuthOptions />
            </View>
        </View>

    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            alignSelf: "center",
            borderRadius: 24,
            backgroundColor: colors.card,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.16,
            shadowRadius: 40,
            elevation: 16,
        },
        closeBtn: {
            position: "absolute",
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
            zIndex: 2,
        },
        title: {
            fontWeight: "600",
            letterSpacing: 0.4,
            textAlign: "center",
            color: colors.text,
        },
        subtitle: {
            marginTop: 10,
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            color: colors.gray100,
        },
        options: {
            marginTop: 24,
        },
    });
}

export default AuthCard;
