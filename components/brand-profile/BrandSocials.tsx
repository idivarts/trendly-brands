import { ISocialAccount, useBrandSocialContext } from "@/contexts/brand-social-context.provider";
import useConnectBrandSocial from "@/hooks/request/use-connect-brand-social";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { faFacebook, faInstagram, faLinkedin, faXTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { faTrash, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, Divider, Surface, Text } from "react-native-paper";

const platformIcon = (platform: ISocialAccount["platform"]) => {
    switch (platform) {
        case "instagram": return faInstagram;
        case "facebook": return faFacebook;
        case "youtube": return faYoutube;
        case "linkedin": return faLinkedin;
        case "twitter": return faXTwitter;
        default: return faInstagram;
    }
};

const platformLabel = (platform: ISocialAccount["platform"]) => {
    const labels: Record<string, string> = {
        instagram: "Instagram",
        facebook: "Facebook",
        youtube: "YouTube",
        linkedin: "LinkedIn",
        twitter: "X / Twitter",
    };
    return labels[platform] ?? platform;
};

interface BrandSocialsProps {
    brandId?: string;
    plainSection?: boolean;
}

const BrandSocials: React.FC<BrandSocialsProps> = ({ brandId, plainSection = false }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors, plainSection), [colors, plainSection]);

    const { socialAccounts, isFetchingSocials, refreshSocials } = useBrandSocialContext();
    const { connectSocial } = useConnectBrandSocial();
    const { openModal } = useConfirmationModel();

    const handleDisconnect = async (socialId: string) => {
        if (!brandId) return;
        try {
            await HttpWrapper.fetch(`/api/v2/brands/${brandId}/socials/${socialId}`, {
                method: "DELETE",
            });
            Toaster.success("Social account disconnected");
            refreshSocials();
        } catch {
            Toaster.error("Failed to disconnect social account");
        }
    };

    const confirmDisconnect = (socialId: string) => {
        openModal({
            title: "Disconnect account?",
            description: "This will remove the social account from your Trendly profile.",
            confirmText: "Disconnect",
            confirmAction: () => handleDisconnect(socialId),
        });
    };

    const content = (
        <View style={styles.container}>
            <Text variant="titleMedium" style={styles.heading}>
                Connected Social Accounts
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
                Connect your brand's social media accounts to enrich your Trendly profile.
            </Text>

            <Divider style={styles.divider} />

            {isFetchingSocials ? (
                <ActivityIndicator style={styles.loader} />
            ) : socialAccounts.length === 0 ? (
                <View style={styles.emptyState}>
                    <FontAwesomeIcon icon={faUsers} size={32} color={colors.gray100} />
                    <Text variant="bodyMedium" style={styles.emptyText}>
                        No social accounts connected yet
                    </Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {socialAccounts.map((account) => (
                        <View key={account.id} style={styles.accountRow}>
                            <View style={[styles.platformBadge]}>
                                <FontAwesomeIcon
                                    icon={platformIcon(account.platform)}
                                    size={18}
                                    color={colors.white}
                                />
                            </View>
                            <View style={styles.accountInfo}>
                                <Text variant="bodyMedium" style={styles.accountName}>
                                    {account.displayName || account.username}
                                </Text>
                                <Text variant="bodySmall" style={styles.accountHandle}>
                                    @{account.username} · {platformLabel(account.platform)}
                                </Text>
                                {account.followerCount > 0 && (
                                    <Text variant="bodySmall" style={styles.followerCount}>
                                        {account.followerCount.toLocaleString()} followers
                                    </Text>
                                )}
                            </View>
                            <Button
                                mode="text"
                                onPress={() => confirmDisconnect(account.id)}
                                compact
                                icon={() => (
                                    <FontAwesomeIcon icon={faTrash} size={14} color={colors.errorBorder} />
                                )}
                            >
                                {""}
                            </Button>
                        </View>
                    ))}
                </View>
            )}

            <Button
                mode="outlined"
                onPress={() => connectSocial()}
                icon="link"
                style={styles.addButton}
            >
                Add Social Account
            </Button>
        </View>
    );

    if (plainSection) return content;

    return (
        <Surface style={styles.surface} elevation={1}>
            {content}
        </Surface>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, plainSection: boolean) {
    return StyleSheet.create({
        surface: {
            borderRadius: 16,
            padding: 20,
            backgroundColor: colors.card,
        },
        container: {
            gap: 8,
        },
        heading: {
            color: colors.text,
            fontWeight: "700",
        },
        subtitle: {
            color: colors.gray100,
        },
        divider: {
            marginVertical: 12,
        },
        loader: {
            marginVertical: 16,
        },
        emptyState: {
            alignItems: "center",
            gap: 8,
            paddingVertical: 20,
        },
        emptyText: {
            color: colors.gray100,
            textAlign: "center",
        },
        list: {
            gap: 12,
        },
        accountRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        platformBadge: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
        },
        accountInfo: {
            flex: 1,
            gap: 2,
        },
        accountName: {
            color: colors.text,
            fontWeight: "600",
        },
        accountHandle: {
            color: colors.gray100,
        },
        followerCount: {
            color: colors.gray100,
        },
        addButton: {
            marginTop: 8,
            borderColor: colors.primary,
        },
    });
}

export default BrandSocials;
