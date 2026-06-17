import { Text } from "@/components/theme/Themed";
import { SOCIAL_PLATFORMS, SocialPlatform } from "@/constants/Socials";
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    ISocialAccount,
    useBrandSocialContext,
} from "@/contexts/brand-social-context.provider";
import { useBreakpoints } from "@/hooks";
import useConnectBrandSocial from "@/hooks/request/use-connect-brand-social";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faLinkSlash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";

const ConnectedAccounts: React.FC = () => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const { selectedBrand, hasCapability } = useBrandContext();
    const canConnectSocials = hasCapability("connect_socials");
    const { socialAccounts, isFetchingSocials, refreshSocials } =
        useBrandSocialContext();
    const { connectSocial } = useConnectBrandSocial();
    const { openModal } = useConfirmationModel();

    const brandId = selectedBrand?.id;

    // Responsive grid: tiles need room for icon + label + status; clamp 1–3 cols.
    const gridColumns = useMemo(() => {
        const available = Math.min(width, 1000) - 40;
        return Math.max(1, Math.min(3, Math.floor(available / 260)));
    }, [width]);

    const connectedPlatforms = useMemo(
        () => new Set(socialAccounts.map((a) => a.platform)),
        [socialAccounts]
    );

    const handleDisconnect = async (socialId: string) => {
        if (!brandId) return;
        try {
            await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/socials/${socialId}`,
                { method: "DELETE" }
            );
            Toaster.success("Social account disconnected");
            refreshSocials();
        } catch {
            Toaster.error("Failed to disconnect social account");
        }
    };

    const confirmDisconnect = (account: ISocialAccount) => {
        const meta = SOCIAL_PLATFORM_MAP[account.platform];
        openModal({
            title: "Disconnect account?",
            description: `This removes @${account.username} (${meta?.label ?? account.platform}) from your Trendly profile. You can reconnect it any time.`,
            confirmText: "Disconnect",
            confirmAction: () => handleDisconnect(account.id),
        });
    };

    return (
        <ScrollView
            contentContainerStyle={[
                styles.scroll,
                { paddingHorizontal: xl ? 24 : 16 },
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Zone 1: Connected accounts ─────────────────────────────── */}
            <Text style={styles.sectionTitle}>Connected accounts</Text>
            <Text style={styles.sectionSubtitle}>
                Accounts linked to {selectedBrand?.name ?? "your brand"}.
            </Text>

            {isFetchingSocials ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : socialAccounts.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <FontAwesomeIcon
                            icon={faLinkSlash}
                            size={24}
                            color={colors.textSecondary}
                        />
                    </View>
                    <Text style={styles.emptyText}>
                        No accounts connected yet
                    </Text>
                    <Text style={styles.emptySubtext}>
                        Connect a platform below to enrich your Trendly profile.
                    </Text>
                </View>
            ) : (
                <View style={styles.connectedList}>
                    {socialAccounts.map((account) => {
                        const meta = SOCIAL_PLATFORM_MAP[account.platform];
                        const brandColor = meta
                            ? (colors[meta.colorKey] as string)
                            : colors.primary;
                        return (
                            <View key={account.id} style={styles.connectedCard}>
                                <View
                                    style={[
                                        styles.accentStripe,
                                        { backgroundColor: brandColor },
                                    ]}
                                />
                                <View style={styles.connectedColumn}>
                                <View style={styles.connectedBody}>
                                    <View style={styles.avatarWrap}>
                                        <ImageComponent
                                            url={account.profileImageURL || ""}
                                            initials={
                                                account.displayName ||
                                                account.username
                                            }
                                            shape="circle"
                                            size="medium"
                                            altText="Profile"
                                            initialsSize={16}
                                            style={styles.avatar}
                                        />
                                        <View
                                            style={[
                                                styles.platformDot,
                                                { backgroundColor: brandColor },
                                            ]}
                                        >
                                            {meta && (
                                                <FontAwesomeIcon
                                                    icon={meta.icon}
                                                    size={11}
                                                    color={colors.white}
                                                />
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.connectedInfo}>
                                        <Text
                                            style={styles.accountName}
                                            numberOfLines={1}
                                        >
                                            {account.displayName ||
                                                account.username}
                                        </Text>
                                        <Text
                                            style={styles.accountHandle}
                                            numberOfLines={1}
                                        >
                                            {/* Facebook's `username` is the numeric Page id and
                                                LinkedIn's is the OpenID `sub` member id — neither is a
                                                handle, so don't surface it; show just the platform. */}
                                            {account.platform === "facebook" ||
                                            account.platform === "linkedin"
                                                ? (meta?.label ?? account.platform)
                                                : `@${account.username} · ${meta?.label ?? account.platform}`}
                                        </Text>
                                        {account.followerCount > 0 && (
                                            <Text style={styles.followerCount}>
                                                {account.followerCount.toLocaleString()}{" "}
                                                followers
                                            </Text>
                                        )}
                                    </View>

                                    {canConnectSocials && (
                                        <Pressable
                                            onPress={() => confirmDisconnect(account)}
                                            style={styles.disconnectBtn}
                                            hitSlop={8}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Disconnect ${meta?.label ?? account.platform}`}
                                        >
                                            <FontAwesomeIcon
                                                icon={faLinkSlash}
                                                size={14}
                                                color={colors.errorBorder}
                                            />
                                            {xl && (
                                                <Text style={styles.disconnectLabel}>
                                                    Disconnect
                                                </Text>
                                            )}
                                        </Pressable>
                                    )}
                                </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* ── Zone 2: Add a platform ─────────────────────────────────── */}
            {canConnectSocials && (
            <>
            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
                Add a platform
            </Text>
            <Text style={styles.sectionSubtitle}>
                Pick a platform to connect — you&apos;ll confirm permissions
                before anything is linked.
            </Text>

            <View style={styles.grid}>
                {SOCIAL_PLATFORMS.map((meta) => {
                    const isConnected = connectedPlatforms.has(
                        meta.key as SocialPlatform
                    );
                    const brandColor = colors[meta.colorKey] as string;
                    return (
                        <Pressable
                            key={meta.key}
                            onPress={() => connectSocial(meta.key)}
                            style={({ pressed, hovered }) => [
                                styles.tile,
                                {
                                    width: `${100 / gridColumns}%`,
                                },
                                (pressed || hovered) && styles.tileActive,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Connect ${meta.label}`}
                        >
                            <View style={styles.tileInner}>
                                <View
                                    style={[
                                        styles.tileBadge,
                                        { backgroundColor: brandColor },
                                    ]}
                                >
                                    <FontAwesomeIcon
                                        icon={meta.icon}
                                        size={20}
                                        color={colors.white}
                                    />
                                </View>
                                <View style={styles.tileText}>
                                    <Text
                                        style={styles.tileLabel}
                                        numberOfLines={1}
                                    >
                                        {meta.label}
                                    </Text>
                                    <Text
                                        style={styles.tileBlurb}
                                        numberOfLines={2}
                                    >
                                        {meta.blurb}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusCircle,
                                        isConnected && styles.statusCircleConnected,
                                    ]}
                                    accessibilityLabel={
                                        isConnected ? "Connected" : undefined
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={isConnected ? faCheck : faPlus}
                                        size={12}
                                        color={
                                            isConnected
                                                ? colors.white
                                                : colors.primary
                                        }
                                    />
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
            </>
            )}
        </ScrollView>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        scroll: {
            paddingVertical: 24,
            maxWidth: 1000,
            width: "100%",
            alignSelf: "center",
            gap: 4,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        sectionTitleSpaced: {
            marginTop: 32,
        },
        sectionSubtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
            marginBottom: 16,
        },
        loader: {
            marginVertical: 24,
        },
        // ── Empty state ───────────────────────────────────────────────
        emptyState: {
            alignItems: "center",
            gap: 6,
            paddingVertical: 36,
            paddingHorizontal: 24,
            backgroundColor: colors.tag,
            borderRadius: 16,
        },
        emptyIcon: {
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
            opacity: 0.7,
        },
        emptyText: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
        },
        emptySubtext: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            paddingHorizontal: 24,
        },
        // ── Connected cards ───────────────────────────────────────────
        connectedList: {
            gap: 12,
        },
        connectedCard: {
            flexDirection: "row",
            borderRadius: 14,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        connectedColumn: {
            flex: 1,
            minWidth: 0,
        },
        accentStripe: {
            width: 4,
            borderTopLeftRadius: 14,
            borderBottomLeftRadius: 14,
        },
        connectedBody: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
        },
        avatarWrap: {
            width: 44,
            height: 44,
        },
        avatar: {
            width: 44,
            height: 44,
        },
        platformDot: {
            position: "absolute",
            right: -2,
            bottom: -2,
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
        },
        connectedInfo: {
            flex: 1,
            gap: 2,
            minWidth: 0,
        },
        accountName: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
        },
        accountHandle: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        followerCount: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        disconnectBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: colors.tag,
            minHeight: 44,
        },
        disconnectLabel: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.errorBorder,
        },
        // ── Platform grid ─────────────────────────────────────────────
        grid: {
            flexDirection: "row",
            flexWrap: "wrap",
        },
        tile: {
            padding: 6,
        },
        tileInner: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.card,
            minHeight: 76,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        tileActive: {
            opacity: 0.85,
            transform: [{ translateY: -1 }],
        },
        tileBadge: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
        },
        tileText: {
            flex: 1,
            gap: 2,
            minWidth: 0,
        },
        tileLabel: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
        },
        tileBlurb: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        statusCircle: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.tag,
            alignItems: "center",
            justifyContent: "center",
        },
        statusCircleConnected: {
            backgroundColor: colors.successForeground,
        },
    });
}

export default ConnectedAccounts;
