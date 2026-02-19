import InfluencerCard from "@/components/explore-influencers/InfluencerCard";
import { KanbanCardT } from "@/components/kanban/BrandCRMBoard";
import Colors from "@/shared-uis/constants/Colors";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
    visible: boolean;
    brand: KanbanCardT | null;
    onClose: () => void;

    discoveredInfluencers: any[];
    loadingInfluencers: boolean;

    campaigns: any[];
    loadingCampaigns: boolean;

    members: any[];
    subscriptionDetails: any;

    formatBudget: (budget: any) => string;
};

export default function BrandDetailsBottomSheet({
    visible,
    brand,
    onClose,
    discoveredInfluencers,
    loadingInfluencers,
    campaigns,
    loadingCampaigns,
    members,
    subscriptionDetails,
    formatBudget,
}: Props) {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    if (!brand) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{brand.name}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Brand Header */}
                        <View style={styles.brandHeaderSection}>
                            <View style={styles.brandImageLarge}>
                                {brand.image ? (
                                    <Image source={{ uri: brand.image }} style={styles.brandImageLarge} />
                                ) : (
                                    <Text style={styles.brandInitial}>
                                        {brand.name?.charAt(0)?.toUpperCase()}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.brandInfoContainer}>
                                <View style={styles.brandNameRow}>
                                    <Text style={styles.brandNameLarge}>{brand.name}</Text>

                                    <View style={styles.brandIconsRow}>
                                        {brand.profile?.phone && (
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(`tel:${brand.profile!.phone}`)}
                                                style={styles.iconButton}
                                            >
                                                <Icon name="phone-outline" size={22} color="#4B5563" />
                                            </TouchableOpacity>
                                        )}
                                        {brand.profile?.website && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    let url = brand.profile!.website;
                                                    if (url && !url.startsWith("http")) url = `https://${url}`;
                                                    if (url) Linking.openURL(url);
                                                }}
                                                style={styles.iconButton}
                                            >
                                                <Icon name="globe-model" size={22} color="#4B5563" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {brand.profile?.about && (
                                    <Text style={styles.brandDescription} numberOfLines={3}>
                                        {brand.profile.about}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Influencers */}
                        {discoveredInfluencers.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    Discovered Influencers ({discoveredInfluencers.length})
                                </Text>

                                {loadingInfluencers ? (
                                    <Text style={styles.centerText}>Loading influencers…</Text>
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {discoveredInfluencers.map((inf) => (
                                            <View key={inf.id} style={{ width: 280, marginRight: 12 }}>
                                                <InfluencerCard item={inf} isCollapsed={false} />
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}

                        {/* Campaigns */}
                        {campaigns.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    Created Campaigns ({campaigns.length})
                                </Text>

                                {loadingCampaigns ? (
                                    <Text style={styles.centerText}>Loading campaigns…</Text>
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {campaigns.map((campaign) => (
                                            <View key={campaign.id} style={styles.campaignCard}>
                                                {/* Header with title and menu */}
                                                <View style={styles.campaignHeaderRow}>
                                                    <Text style={styles.campaignTitle} numberOfLines={1}>
                                                        {campaign.name}
                                                    </Text>
                                                    <TouchableOpacity>
                                                        <Icon name="dots-vertical" size={24} color="#4B5563" />
                                                    </TouchableOpacity>
                                                </View>

                                                {campaign.description && (
                                                    <Text style={styles.campaignDescription} numberOfLines={2}>
                                                        {campaign.description}
                                                    </Text>
                                                )}

                                                {/* Badges */}
                                                <View style={styles.badgesContainer}>
                                                    {campaign.promotionType && (
                                                        <View style={styles.badge}>
                                                            <Icon name="cash" size={14} color="white" />
                                                            <Text style={styles.badgeText}>Paid</Text>
                                                        </View>
                                                    )}
                                                    {campaign.location && (
                                                        <View style={styles.badge}>
                                                            <Icon name="home" size={14} color="white" />
                                                            <Text style={styles.badgeText}>
                                                                {typeof campaign.location === "string"
                                                                    ? campaign.location
                                                                    : campaign.location?.name || "Remote"}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {campaign.platform && Array.isArray(campaign.platform) && campaign.platform.map((p: string, idx: number) => {
                                                        const iconName = p.toLowerCase() === "instagram" ? "instagram" : p.toLowerCase() === "youtube" ? "youtube" : p.toLowerCase() === "tiktok" ? "tiktok" : "link";
                                                        return (
                                                            <View key={idx} style={styles.badge}>
                                                                <Icon name={iconName as any} size={14} color="white" />
                                                                <Text style={styles.badgeText}>{p}</Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>

                                                {/* Stats Grid */}
                                                <View style={styles.statsGrid}>
                                                    <View style={styles.statsColumn}>
                                                        <View style={styles.statBlock}>
                                                            <Text style={styles.statLabel}>Influencers</Text>
                                                            <Text style={styles.statValue}>{campaign.numberOfInfluencersNeeded || 0}</Text>
                                                        </View>
                                                        <View style={styles.statBlock}>
                                                            <Text style={styles.statLabel}>Budget</Text>
                                                            <Text style={styles.statValue} numberOfLines={1}>{formatBudget(campaign.budget)}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.statsColumn}>
                                                        <View style={styles.statBlock}>
                                                            <Text style={styles.statLabel}>Applied</Text>
                                                            <Text style={styles.statValue}>{campaign.applications || 0}</Text>
                                                        </View>
                                                        <View style={styles.statBlock}>
                                                            <Text style={styles.statLabel}>Invited</Text>
                                                            <Text style={styles.statValue}>{campaign.invitations || 0}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}

                        {/* Members */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Members</Text>

                            {members.length === 0 ? (
                                <Text style={styles.emptyText}>No members found</Text>
                            ) : (
                                members.map((m) => (
                                    <View key={m.id} style={styles.memberRow}>
                                        <Image
                                            source={{ uri: m.image || m.photoURL }}
                                            style={styles.memberImage}
                                        />
                                        <View>
                                            <Text style={styles.memberName}>{m.name || "Unknown"}</Text>
                                            <Text style={styles.memberEmail}>{m.email}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Subscription */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Subscription Details</Text>

                            {!subscriptionDetails ? (
                                <Text style={styles.emptyText}>No subscription details available</Text>
                            ) : (
                                <View style={styles.subscriptionContainer}>
                                    <View style={styles.subscriptionRow}>
                                        <Text style={styles.subscriptionLabel}>Current Plan:</Text>
                                        <Text style={styles.subscriptionValue}>
                                            {(subscriptionDetails.planKey || "N/A").charAt(0).toUpperCase() + (subscriptionDetails.planKey || "N/A").slice(1)}
                                        </Text>
                                    </View>
                                    <View style={styles.subscriptionRow}>
                                        <Text style={styles.subscriptionLabel}>Frequency:</Text>
                                        <Text style={styles.subscriptionValue}>
                                            {(subscriptionDetails.planCycle || subscriptionDetails.frequency || subscriptionDetails.interval || "N/A").charAt(0).toUpperCase() + (subscriptionDetails.planCycle || subscriptionDetails.frequency || subscriptionDetails.interval || "N/A").slice(1)}
                                        </Text>
                                    </View>
                                    <View style={styles.subscriptionRow}>
                                        <Text style={styles.subscriptionLabel}>Status:</Text>
                                        <Text style={styles.subscriptionValue}>
                                            {subscriptionDetails.billingStatus || (subscriptionDetails.status === 1 ? "Active" : "Inactive")}
                                        </Text>
                                    </View>
                                    {subscriptionDetails.isOnTrial !== undefined && (
                                        <View style={styles.subscriptionRow}>
                                            <Text style={styles.subscriptionLabel}>Trial:</Text>
                                            <Text style={styles.subscriptionValue}>
                                                {subscriptionDetails.isOnTrial ? "Yes" : "No"}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
        },
        modalContent: {
            backgroundColor: colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "90%",
        },
        modalHeader: {
            padding: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderColor: "#E5E7EB",
        },
        modalTitle: { fontSize: 20, fontWeight: "700" },
        closeButton: { fontSize: 22 },
        modalBody: { padding: 20 },
        brandHeaderSection: { flexDirection: "row", gap: 16 },
        brandImageLarge: {
            width: 96,
            height: 96,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F3F4F6",
        },
        brandInitial: { fontSize: 42, fontWeight: "700" },
        brandInfoContainer: { flex: 1 },
        brandNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
        brandNameLarge: { fontSize: 22, fontWeight: "700" },
        brandIconsRow: { flexDirection: "row", gap: 6 },
        iconButton: { padding: 6 },
        brandDescription: { marginTop: 8, color: "#6B7280" },
        section: { marginTop: 24 },
        sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
        centerText: { textAlign: "center", opacity: 0.7 },
        emptyText: { fontStyle: "italic", opacity: 0.6 },
        campaignCard: {
            width: 340,
            padding: 16,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 8,
            marginRight: 12,
        },
        campaignHeaderRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        campaignTitle: {
            fontWeight: "700",
            fontSize: 16,
            flex: 1,
            color: colors.text,
        },
        campaignDescription: {
            fontSize: 13,
            color: "#6B7280",
            marginBottom: 12,
            lineHeight: 18,
        },
        badgesContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
        },
        badge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#1D425D",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        badgeText: {
            fontSize: 12,
            fontWeight: "500",
            color: "white",
        },
        statsGrid: {
            flexDirection: "row",
            gap: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderColor: "#E5E7EB",
        },
        statsColumn: {
            flex: 1,
            gap: 8,
        },
        statBlock: {
            alignItems: "center",
        },
        statLabel: {
            fontSize: 11,
            color: "#9CA3AF",
            marginBottom: 2,
        },
        statValue: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        campaignBudget: { marginTop: 4, color: "#6B7280" },
        memberRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
        memberImage: { width: 44, height: 44, borderRadius: 22 },
        memberName: { fontWeight: "600" },
        memberEmail: { color: "#6B7280" },
        subscriptionContainer: {
            gap: 12,
        },
        subscriptionRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 4,
        },
        subscriptionLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        subscriptionValue: {
            fontSize: 14,
            fontWeight: "400",
            color: "#6B7280",
        },
    });