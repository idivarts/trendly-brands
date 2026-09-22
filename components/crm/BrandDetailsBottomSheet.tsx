import { KanbanCardT } from "@/components/kanban/BrandCRMBoard";
import { Console } from "@/shared-libs/utils/console";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { IBrandUsageDetail } from "@/types/BrandUsage";
import {
    compactNumber,
    contentStatusLabel,
    platformIcon,
    platformLabel,
    relativeTime,
    tokenPercentUsed,
} from "@/utils/brand-usage";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
};

export default function BrandDetailsBottomSheet({
    visible,
    brand,
    onClose,
}: Props) {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [detail, setDetail] = useState<IBrandUsageDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const brandId = brand?.id;

    useEffect(() => {
        if (!visible || !brandId) {
            setDetail(null);
            setError(null);
            return;
        }

        let cancelled = false;
        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await HttpWrapper.fetch(
                    `/api/v2/admin/brands/${brandId}/usage`,
                    { method: "GET" }
                );
                const body = await res.json();
                if (!cancelled) setDetail(body);
            } catch (err: any) {
                Console.error(err, "Failed to fetch brand usage detail");
                const message = await HttpWrapper.extractErrorMessage(err);
                if (!cancelled) setError(message || "Unable to load usage details");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchDetail();

        // A slow request for a previously-selected brand must not overwrite the
        // detail of the one now open.
        return () => {
            cancelled = true;
        };
    }, [visible, brandId]);

    if (!brand) return null;

    const copy = async (value: string, label: string) => {
        await Clipboard.setStringAsync(value);
        Alert.alert("Copied", `${label} copied to clipboard`);
    };

    const tokens = detail?.tokens;
    const percentUsed = tokenPercentUsed(tokens);
    const owner = detail?.owner;
    const content = detail?.content;
    const statusEntries = Object.entries(content?.byStatus ?? {}).sort(
        (a, b) => b[1] - a[1]
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable
                    style={styles.modalContent}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle} numberOfLines={1}>
                            {brand.name}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={22} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalBody}>
                        {/* Brand + owner */}
                        <View style={styles.brandHeaderSection}>
                            <View style={styles.brandImageLarge}>
                                {brand.image ? (
                                    <Image
                                        source={{ uri: brand.image }}
                                        style={styles.brandImageLarge}
                                    />
                                ) : (
                                    <Text style={styles.brandInitial}>
                                        {brand.name?.charAt(0)?.toUpperCase()}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.brandInfoContainer}>
                                <Text style={styles.brandNameLarge} numberOfLines={1}>
                                    {brand.name}
                                </Text>

                                {owner ? (
                                    <>
                                        <Text style={styles.ownerName} numberOfLines={1}>
                                            {owner.name || "Unknown owner"}
                                            {owner.source === "brand_creator"
                                                ? " (creator)"
                                                : ""}
                                        </Text>
                                        {owner.email ? (
                                            <TouchableOpacity
                                                style={styles.chipRow}
                                                onPress={() =>
                                                    copy(owner.email!, "Email")
                                                }
                                            >
                                                <Icon
                                                    name="email-outline"
                                                    size={15}
                                                    color={colors.textSecondary}
                                                />
                                                <Text
                                                    style={styles.chipText}
                                                    numberOfLines={1}
                                                >
                                                    {owner.email}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </>
                                ) : null}

                                {brand.profile?.phone ? (
                                    <TouchableOpacity
                                        style={styles.chipRow}
                                        onPress={() =>
                                            copy(brand.profile!.phone!, "Phone number")
                                        }
                                    >
                                        <Icon
                                            name="phone-outline"
                                            size={15}
                                            color={colors.textSecondary}
                                        />
                                        <Text style={styles.chipText} numberOfLines={1}>
                                            {brand.profile.phone}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}

                                {brand.profile?.website ? (
                                    <TouchableOpacity
                                        style={styles.chipRow}
                                        onPress={() => {
                                            let url = brand.profile!.website!;
                                            if (!url.startsWith("http")) {
                                                url = `https://${url}`;
                                            }
                                            Linking.openURL(url);
                                        }}
                                    >
                                        <Icon
                                            name="web"
                                            size={15}
                                            color={colors.textSecondary}
                                        />
                                        <Text style={styles.chipText} numberOfLines={1}>
                                            {brand.profile.website}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>

                        {loading && (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color={colors.primary} size="small" />
                                <Text style={styles.mutedText}>Loading usage…</Text>
                            </View>
                        )}
                        {error && <Text style={styles.errorText}>{error}</Text>}

                        {detail && (
                            <>
                                {/* Usage & engagement */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>
                                        Usage &amp; Engagement
                                    </Text>

                                    <View style={styles.statGrid}>
                                        <StatTile
                                            icon="message-text-outline"
                                            value={compactNumber(detail.aiConversations)}
                                            label="AI conversations"
                                        />
                                        <StatTile
                                            icon="file-document-outline"
                                            value={compactNumber(detail.contentTotal)}
                                            label="Content created"
                                        />
                                        <StatTile
                                            icon="lightbulb-outline"
                                            value={compactNumber(detail.strategiesTotal)}
                                            label="Strategies"
                                        />
                                        <StatTile
                                            icon="calendar-arrow-right"
                                            value={compactNumber(
                                                content?.fromStrategy ?? 0
                                            )}
                                            label="From strategy push"
                                        />
                                    </View>

                                    {statusEntries.length > 0 && (
                                        <View style={styles.breakdownBlock}>
                                            <Text style={styles.breakdownTitle}>
                                                Content by status
                                            </Text>
                                            {statusEntries.map(([status, count]) => (
                                                <View
                                                    key={status}
                                                    style={styles.breakdownRow}
                                                >
                                                    <Text style={styles.breakdownLabel}>
                                                        {contentStatusLabel(status)}
                                                    </Text>
                                                    <Text style={styles.breakdownValue}>
                                                        {count}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Token wallet */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Token Wallet</Text>

                                    {!tokens ? (
                                        <Text style={styles.mutedText}>
                                            No organization wallet for this brand.
                                        </Text>
                                    ) : (
                                        <View style={styles.breakdownBlock}>
                                            {tokens.sharedAcrossBrands > 1 && (
                                                <Text style={styles.noticeText}>
                                                    Wallet is shared across{" "}
                                                    {tokens.sharedAcrossBrands} brands in
                                                    this organization — these figures
                                                    cover all of them.
                                                </Text>
                                            )}
                                            <DetailRow
                                                label="Used this period"
                                                value={
                                                    percentUsed === null
                                                        ? compactNumber(tokens.consumed)
                                                        : `${compactNumber(
                                                              tokens.consumed
                                                          )} (${percentUsed}%)`
                                                }
                                            />
                                            <DetailRow
                                                label="Monthly allotment"
                                                value={compactNumber(
                                                    tokens.monthlyAllotment
                                                )}
                                            />
                                            <DetailRow
                                                label="Remaining"
                                                value={compactNumber(tokens.balance)}
                                            />
                                            <DetailRow
                                                label="Top-up balance"
                                                value={compactNumber(
                                                    tokens.topupBalance
                                                )}
                                            />
                                            {tokens.planKey ? (
                                                <DetailRow
                                                    label="Plan"
                                                    value={tokens.planKey.toUpperCase()}
                                                />
                                            ) : null}
                                        </View>
                                    )}
                                </View>

                                {/* Members + devices */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>
                                        Members ({detail.members?.length ?? 0})
                                    </Text>

                                    {!detail.members || detail.members.length === 0 ? (
                                        <Text style={styles.mutedText}>
                                            No members found
                                        </Text>
                                    ) : (
                                        detail.members.map((member) => (
                                            <View
                                                key={member.managerId}
                                                style={styles.memberRow}
                                            >
                                                <View style={styles.memberImage}>
                                                    {member.profileImage ? (
                                                        <Image
                                                            source={{
                                                                uri: member.profileImage,
                                                            }}
                                                            style={styles.memberImage}
                                                        />
                                                    ) : (
                                                        <Text
                                                            style={styles.memberInitial}
                                                        >
                                                            {(
                                                                member.name ||
                                                                member.email ||
                                                                "U"
                                                            )
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </Text>
                                                    )}
                                                </View>

                                                <View style={styles.memberInfo}>
                                                    <Text
                                                        style={styles.memberName}
                                                        numberOfLines={1}
                                                    >
                                                        {member.name || "Unknown"}
                                                    </Text>
                                                    <Text
                                                        style={styles.memberEmail}
                                                        numberOfLines={1}
                                                    >
                                                        {member.email}
                                                    </Text>
                                                </View>

                                                <View style={styles.devicePill}>
                                                    <Icon
                                                        name={
                                                            platformIcon(
                                                                member.lastSeenPlatform
                                                            ) as any
                                                        }
                                                        size={14}
                                                        color={colors.textSecondary}
                                                    />
                                                    <View>
                                                        <Text style={styles.deviceText}>
                                                            {platformLabel(
                                                                member.lastSeenPlatform
                                                            )}
                                                        </Text>
                                                        {member.lastSeenAt ? (
                                                            <Text
                                                                style={styles.deviceTime}
                                                            >
                                                                {relativeTime(
                                                                    member.lastSeenAt
                                                                )}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </>
                        )}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const StatTile = ({
    icon,
    value,
    label,
}: {
    icon: string;
    value: string;
    label: string;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <View style={styles.statTile}>
            <Icon name={icon as any} size={18} color={colors.primary} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel} numberOfLines={2}>
                {label}
            </Text>
        </View>
    );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{label}</Text>
            <Text style={styles.breakdownValue}>{value}</Text>
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: colors.backdrop,
            justifyContent: "flex-end",
        },
        modalContent: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "90%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 16,
            shadowOpacity: 0.12,
            elevation: 12,
        },
        modalHeader: {
            padding: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
        },
        modalTitle: {
            fontSize: 19,
            fontWeight: "700",
            color: colors.text,
            flexShrink: 1,
        },
        closeButton: { padding: 4 },
        modalBody: { paddingHorizontal: 20, paddingBottom: 32 },

        brandHeaderSection: { flexDirection: "row", gap: 16 },
        brandImageLarge: {
            width: 84,
            height: 84,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.tag,
        },
        brandInitial: { fontSize: 34, fontWeight: "700", color: colors.textSecondary },
        brandInfoContainer: { flex: 1, minWidth: 0 },
        brandNameLarge: { fontSize: 19, fontWeight: "700", color: colors.text },
        ownerName: { fontSize: 13, color: colors.text, marginTop: 4 },
        chipRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 5,
            paddingHorizontal: 8,
            backgroundColor: colors.tag,
            borderRadius: 8,
            marginTop: 6,
            alignSelf: "flex-start",
            maxWidth: "100%",
        },
        chipText: { fontSize: 12, color: colors.text, flexShrink: 1 },

        loadingRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
        },
        mutedText: { fontSize: 13, color: colors.textSecondary },
        errorText: { fontSize: 13, color: colors.red, marginTop: 20 },
        noticeText: {
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 10,
            lineHeight: 17,
        },

        section: { marginTop: 26 },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 12,
        },

        statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
        statTile: {
            flexGrow: 1,
            flexBasis: 120,
            backgroundColor: colors.tag,
            borderRadius: 10,
            padding: 12,
            gap: 4,
        },
        statValue: { fontSize: 18, fontWeight: "700", color: colors.text },
        statLabel: { fontSize: 11, color: colors.textSecondary },

        breakdownBlock: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            padding: 12,
            marginTop: 12,
        },
        breakdownTitle: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 0.4,
        },
        breakdownRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 5,
            gap: 12,
        },
        breakdownLabel: { fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
        breakdownValue: { fontSize: 13, fontWeight: "700", color: colors.text },

        memberRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 8,
        },
        memberImage: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.tag,
            justifyContent: "center",
            alignItems: "center",
        },
        memberInitial: { fontSize: 16, fontWeight: "700", color: colors.textSecondary },
        memberInfo: { flex: 1, minWidth: 0 },
        memberName: { fontSize: 14, fontWeight: "600", color: colors.text },
        memberEmail: { fontSize: 12, color: colors.textSecondary },
        devicePill: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.tag,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 5,
        },
        deviceText: { fontSize: 12, fontWeight: "600", color: colors.text },
        deviceTime: { fontSize: 10, color: colors.textSecondary },
    });
