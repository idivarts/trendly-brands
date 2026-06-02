import {
    faFacebookF,
    faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import { faComments, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";

const EmptyNoSocials: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.iconCluster}>
                <View style={[styles.iconBubble, styles.iconBubbleLeft, { backgroundColor: colors.socialInstagram }]}>
                    <FontAwesomeIcon icon={faInstagram} size={22} color={colors.white} />
                </View>
                <View style={[styles.iconBubble, styles.iconBubbleCenter, { backgroundColor: colors.primary }]}>
                    <FontAwesomeIcon icon={faComments} size={26} color={colors.white} />
                </View>
                <View style={[styles.iconBubble, styles.iconBubbleRight, { backgroundColor: colors.socialFacebook }]}>
                    <FontAwesomeIcon icon={faFacebookF} size={22} color={colors.white} />
                </View>
            </View>

            <Text style={styles.title}>All your DMs & comments, in one place</Text>
            <Text style={styles.subtitle}>
                Connect your Instagram and Facebook accounts to manage messages and
                comment replies across every channel — without leaving Trendly.
            </Text>

            <Pressable
                onPress={() => router.push("/connected-accounts" as any)}
                style={[styles.cta, { backgroundColor: colors.primary }]}
            >
                <FontAwesomeIcon icon={faPlus} size={15} color={colors.onPrimary} />
                <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                    Connect accounts
                </Text>
            </Pressable>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 32,
                    backgroundColor: colors.background,
                },
                iconCluster: {
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 28,
                },
                iconBubble: {
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 24,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.12,
                    elevation: 4,
                },
                iconBubbleLeft: {
                    width: 48,
                    height: 48,
                    transform: [{ rotate: "-8deg" }, { translateX: 10 }],
                    zIndex: 1,
                },
                iconBubbleCenter: {
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    zIndex: 2,
                },
                iconBubbleRight: {
                    width: 48,
                    height: 48,
                    transform: [{ rotate: "8deg" }, { translateX: -10 }],
                    zIndex: 1,
                },
                title: {
                    fontSize: 22,
                    fontWeight: "800",
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: 12,
                },
                subtitle: {
                    fontSize: 15,
                    lineHeight: 22,
                    color: colors.textSecondary,
                    textAlign: "center",
                    maxWidth: 420,
                    marginBottom: 28,
                },
                cta: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 24,
                    height: 50,
                    borderRadius: 25,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                ctaText: {
                    fontSize: 16,
                    fontWeight: "700",
                },
            }),
        [colors]
    );
}

export default EmptyNoSocials;
