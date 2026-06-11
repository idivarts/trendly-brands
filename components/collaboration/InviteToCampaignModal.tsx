import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { processRawAttachment } from "@/shared-libs/utils/attachments";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import ImageComponent from "@/shared-uis/components/image-component";
import { useTheme } from "@react-navigation/native";
import { Video } from "expo-av";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    type ViewStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Checkbox } from "react-native-paper";

type Collaboration = {
    id: string;
    name: string;
    description: string;
    mediaUrl?: string;
    isVideo?: boolean;
    active?: boolean;
};

type Props = {
    onClose: () => void;
    onInvite: (selectedIds: string[]) => Promise<boolean>;
    // optional influencers being invited. If provided, the modal header should reflect it
    influencers?: { id: string; name?: string }[];
    brandId?: string;
    onNavigateToCampaigns?: () => void;
};

const InviteToCampaignModal: React.FC<Props> = ({
    onClose,
    onInvite,
    influencers,
    brandId,
    onNavigateToCampaigns,
}) => {
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const theme = useTheme();
    const colors = Colors(theme);
    const { width, height, xl } = useBreakpoints();
    const styles = useStyles(colors, xl);
    const { selectedBrand } = useBrandContext();
    const effectiveBrandId = brandId ?? selectedBrand?.id;
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isWeb = Platform.OS === "web";
    const horizontalInset = isWeb ? 0 : 16;
    const maxModalWidth = 700;
    const containerStyle: ViewStyle = {
        width: isWeb ? Math.min(maxModalWidth, width * 0.9) : Math.max(0, width - horizontalInset * 2),
        maxWidth: maxModalWidth,
        ...(isWeb ? { minWidth: 640 } : {}),
        maxHeight: isWeb ? "80%" : Math.min(height * 0.85, height - 64),
    };
    const toggleCampaignSelection = (id: string) => {
        setSelectedCampaignIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        const fetchActiveCollaborations = async () => {
            try {
                setLoading(true);

                if (!effectiveBrandId) return;

                const coll = collection(FirestoreDB, "collaborations");
                const q = query(
                    coll,
                    where("brandId", "==", effectiveBrandId),
                    where("status", "==", "active"),
                    orderBy("timeStamp", "desc")
                );

                const snap = await getDocs(q);

                const items = snap.docs.map((d) => {
                    const data = d.data() as any;
                    const attachments = Array.isArray(data.attachments)
                        ? data.attachments
                        : [];
                    const first = attachments[0];
                    const processed = first ? processRawAttachment(first) : undefined;

                    return {
                        id: d.id,
                        name: data.name || "",
                        description: data.description || "",
                        mediaUrl:
                            processed?.url ||
                            first?.imageUrl ||
                            first?.url ||
                            "https://via.placeholder.com/300x200.png?text=No+Image",
                        isVideo: processed?.type?.includes("video") || false,
                        active: true,
                    };
                });

                setCollaborations(items);
            } catch (err) {
                console.warn("Failed to load active collaborations", err);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveCollaborations();
    }, [effectiveBrandId]);

    const handleInvite = async () => {
        if (selectedCampaignIds.length === 0 || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const isSuccess = await onInvite(selectedCampaignIds);
            if (isSuccess) {
                setSelectedCampaignIds([]);
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedCampaignIds([]);
        onClose();
    };

    const renderCampaignItem = ({ item }: { item: Collaboration }) => {
        if (!item.active) return null;
        const isSelected = selectedCampaignIds.includes(item.id);

        return (
            <Pressable
                onPress={() => toggleCampaignSelection(item.id)}
                style={[
                    styles.campaignCard,
                    isSelected && styles.campaignCardSelected,
                ]}
            >
                <View style={styles.campaignInfo}>
                    <Text numberOfLines={1} style={styles.campaignName}>
                        {item.name}
                    </Text>
                    {!!item.description && (
                        <Text numberOfLines={1} style={styles.campaignDescription}>
                            {item.description}
                        </Text>
                    )}
                </View>
                <View pointerEvents="none">
                    <Checkbox
                        status={isSelected ? "checked" : "unchecked"}
                    />
                </View>
            </Pressable>
        );
    };

    return (
        <Modal visible={true} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.container, containerStyle]}>
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerTitle} numberOfLines={2}>
                                {influencers && influencers?.length > 1
                                    ? `Invite ${influencers.length} influencers`
                                    : influencers && influencers?.length === 1
                                        ? `Invite ${influencers[0].name ?? "Influencer"}`
                                        : "Invite Influencer"}
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Close invite modal"
                                onPress={handleClose}
                                style={styles.closeButton}
                            >
                                <MaterialIcons
                                    name="close"
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            Select one or more campaigns to send invitations to this
                            influencer.
                        </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.contentSection}>
                        {loading ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator />
                                <Text style={styles.loadingText}>Loading campaigns...</Text>
                            </View>
                        ) : collaborations.length === 0 ? (
                            <View style={styles.createCampaignOnlyWrap}>
                                <View style={styles.createCampaignCard}>
                                    <View style={styles.createCampaignIconWrap}>
                                        <MaterialIcons
                                            name="campaign"
                                            size={28}
                                            color={colors.primary}
                                        />
                                    </View>
                                    <View style={styles.createCampaignTextWrap}>
                                        <Text style={styles.createCampaignTitle}>
                                            Create Campaign
                                        </Text>
                                        <Text style={styles.createCampaignSubtitle}>
                                            Don&apos;t have a campaign ready yet? Create one now to
                                            start collaborating with top influencers.
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={() => {
                                            onNavigateToCampaigns?.();
                                            onClose();
                                        }}
                                        style={styles.createNowButton}
                                    >
                                        <MaterialIcons
                                            name="add"
                                            size={18}
                                            color={colors.white}
                                        />
                                        <Text style={styles.createNowButtonText}>
                                            Create Now
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.selectSection}>
                                    <Text style={styles.selectLabel}>Select campaigns</Text>
                                </View>
                                <FlatList
                                    data={collaborations}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderCampaignItem}
                                    contentContainerStyle={styles.campaignListContent}
                                    showsVerticalScrollIndicator={false}
                                />
                            </>
                        )}
                    </View>

                    {/* Footer */}
                    {!loading && collaborations.length > 0 && (
                        <View style={styles.footerSection}>
                            <Pressable
                                onPress={handleClose}
                                style={[styles.footerButton, styles.cancelButton]}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleInvite}
                                style={[
                                    styles.footerButton,
                                    styles.inviteButton,
                                    (selectedCampaignIds.length === 0 || isSubmitting) &&
                                        styles.inviteButtonDisabled,
                                ]}
                                disabled={selectedCampaignIds.length === 0 || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <View style={styles.inviteButtonLoadingRow}>
                                        <ActivityIndicator size="small" color={colors.white} />
                                        <Text style={styles.inviteButtonText}>
                                            Inviting...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.inviteButtonText}>Invite Now</Text>
                                )}
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: colors.backdrop,
            justifyContent: "center",
            alignItems: "center",
        },
        container: {
            borderRadius: 12,
            backgroundColor: colors.card,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
        },
        headerSection: {
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 8,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
        },
        headerTitle: {
            flex: 1,
            fontSize: 26,
            fontWeight: "800",
            color: colors.text,
            lineHeight: 34,
        },
        headerSubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        closeButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.transparent,
        },
        contentSection: {
            padding: 20,
            gap: 18,
            minHeight: 160,
        },
        loadingWrap: {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 24,
            gap: 10,
        },
        loadingText: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        createCampaignOnlyWrap: {
            alignItems: "center",
            justifyContent: "center",
        },
        createCampaignCard: {
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: colors.border,
            backgroundColor: colors.background,
            paddingVertical: 18,
            paddingHorizontal: 16,
            gap: 12,
        },
        createCampaignIconWrap: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.glassSurface,
            alignItems: "center",
            justifyContent: "center",
        },
        createCampaignTextWrap: {
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            maxWidth: 520,
        },
        createCampaignTitle: {
            fontSize: 16,
            fontWeight: "800",
            color: colors.text,
        },
        createCampaignSubtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 18,
        },
        createNowButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingHorizontal: 18,
            paddingVertical: 10,
        },
        createNowButtonText: {
            color: colors.white,
            fontSize: 13,
            fontWeight: "700",
        },
        selectSection: {
            gap: 8,
        },
        selectLabel: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.text,
        },
        campaignListContent: {
            paddingBottom: 6,
        },
        campaignCard: {
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            marginBottom: 10,
        },
        campaignCardSelected: {
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: colors.card,
        },
        campaignInfo: {
            flex: 1,
            gap: 4,
            paddingRight: 10,
        },
        campaignName: {
            fontSize: 14,
            fontWeight: "800",
            color: colors.text,
        },
        campaignDescription: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        footerSection: {
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: xl ? "row" : "column",
            justifyContent: "flex-end",
            alignItems: "stretch",
            gap: 12,
        },
        footerButton: {
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 18,
            alignItems: "center",
            justifyContent: "center",
            ...(xl ? {} : { width: "100%" }),
        },
        cancelButton: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        cancelButtonText: {
            color: colors.text,
            fontWeight: "700",
            fontSize: 13,
        },
        inviteButton: {
            backgroundColor: colors.primary,
        },
        inviteButtonDisabled: {
            opacity: 0.6,
        },
        inviteButtonText: {
            color: colors.white,
            fontWeight: "800",
            fontSize: 13,
        },
        inviteButtonLoadingRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
    });

export default InviteToCampaignModal;
