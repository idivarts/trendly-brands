import { Text, View } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { faCopy, faLink, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, Share, StyleSheet } from "react-native";

/** Public application/share link for a collaboration. */
export const collaborationShareLink = (collaborationId: string) =>
    `${CREATORS_FE_URL}/collaboration/${collaborationId}`;

interface Props {
    collaborationId: string;
    /**
     * "page"  — full-bleed hero used as the entire Send Invitations tab for
     *           non-India brands (no in-app discovery there).
     * "inline" — compact banner shown above the discovery grid for India brands
     *           so they know they can also share the link directly.
     */
    variant: "page" | "inline";
}

const CollaborationLinkShare: React.FC<Props> = ({ collaborationId, variant }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 900;
    const styles = useMemo(() => makeStyles(colors, isWide), [colors, isWide]);

    const link = collaborationShareLink(collaborationId);

    const copyLink = useCallback(async () => {
        await Clipboard.setStringAsync(link);
        Toaster.success("Link copied to clipboard");
    }, [link]);

    const shareLink = useCallback(async () => {
        try {
            await Share.share({
                message: `Apply to our collaboration on Trendly: ${link}`,
                url: link,
            });
        } catch {
            // user dismissed share sheet — no-op
        }
    }, [link]);

    if (variant === "inline") {
        return (
            <View style={styles.banner}>
                <View style={styles.bannerIcon}>
                    <FontAwesomeIcon icon={faLink} size={14} color={colors.primary} />
                </View>
                <View style={styles.bannerTextWrap}>
                    <Text style={styles.bannerTitle}>Not seeing someone here?</Text>
                    <Text style={styles.bannerSubtitle} numberOfLines={2}>
                        Share your collaboration link so any creator can apply directly.
                    </Text>
                </View>
                <Pressable
                    onPress={copyLink}
                    style={({ pressed }) => [styles.bannerBtn, pressed && styles.pressed]}
                >
                    <FontAwesomeIcon icon={faCopy} size={13} color={colors.onPrimary} />
                    <Text style={styles.bannerBtnText}>Copy link</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.page}>
            <View style={styles.hero}>
                <View style={styles.heroIcon}>
                    <FontAwesomeIcon icon={faLink} size={22} color={colors.primary} />
                </View>
                <Text style={styles.headline}>Invite creators with a link</Text>
                <Text style={styles.subtitle}>
                    Share your collaboration link with any creator you'd like to work with.
                    They can open it and apply to your campaign directly — no in-app search
                    needed.
                </Text>

                <View style={styles.linkBox}>
                    <Text style={styles.linkText} numberOfLines={1}>
                        {link}
                    </Text>
                </View>

                <Pressable
                    onPress={copyLink}
                    style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
                >
                    <FontAwesomeIcon icon={faCopy} size={15} color={colors.onPrimary} />
                    <Text style={styles.ctaText}>Copy collaboration link</Text>
                </Pressable>

                <Pressable
                    onPress={shareLink}
                    style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
                >
                    <FontAwesomeIcon icon={faShareNodes} size={14} color={colors.primary} />
                    <Text style={styles.secondaryCtaText}>Share via…</Text>
                </Pressable>
            </View>
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>, isWide: boolean) {
    return StyleSheet.create({
        // ── inline banner ────────────────────────────────────────────────
        banner: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            marginHorizontal: 12,
            marginTop: 12,
            marginBottom: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        bannerIcon: {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        bannerTextWrap: { flex: 1 },
        bannerTitle: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        bannerSubtitle: {
            fontSize: 12,
            lineHeight: 17,
            color: colors.textSecondary,
            marginTop: 2,
        },
        bannerBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 999,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        bannerBtnText: {
            color: colors.onPrimary,
            fontSize: 13,
            fontWeight: "700",
        },

        // ── full page ────────────────────────────────────────────────────
        page: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: isWide ? 32 : 16,
        },
        hero: {
            width: "100%",
            maxWidth: 520,
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: isWide ? 36 : 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 16,
            shadowOpacity: 0.08,
            elevation: 4,
        },
        heroIcon: {
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
            marginBottom: 16,
        },
        headline: {
            fontSize: isWide ? 24 : 20,
            fontWeight: "800",
            color: colors.text,
            textAlign: "center",
        },
        subtitle: {
            marginTop: 10,
            fontSize: 14,
            lineHeight: 22,
            color: colors.textSecondary,
            textAlign: "center",
        },
        linkBox: {
            marginTop: 20,
            width: "100%",
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        linkText: {
            fontSize: 13,
            color: colors.text,
        },
        cta: {
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            paddingVertical: 13,
            borderRadius: 999,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        ctaText: {
            color: colors.onPrimary,
            fontSize: 15,
            fontWeight: "700",
        },
        secondaryCta: {
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 16,
        },
        secondaryCtaText: {
            color: colors.primary,
            fontSize: 14,
            fontWeight: "600",
        },
        pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    });
}

export default CollaborationLinkShare;
