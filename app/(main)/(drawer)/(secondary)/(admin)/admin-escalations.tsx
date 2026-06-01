import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import { useAuthContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import { ContractStatus, normalizeStatus } from "@/shared-constants/contract-status";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
} from "react-native";

interface EscalationCard {
    id: string;
    contract: IContracts;
    influencer: IUsers | null;
}

function useEscalationContracts(statusFilter: number[], slaOnly = false) {
    const [cards, setCards] = useState<EscalationCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const filterKey = statusFilter.join(",");

    const fetchData = useCallback(async () => {
        try {
            const contractsCol = collection(FirestoreDB, "contracts");
            const q = query(contractsCol, where("status", "in", statusFilter));
            const snap = await getDocs(q);

            const docs = slaOnly
                ? snap.docs.filter((d) => {
                      const warnings = d.data().slaWarnings;
                      return Array.isArray(warnings) && warnings.length > 0;
                  })
                : snap.docs;

            const results = await Promise.all(
                docs.map(async (d) => {
                    const contract = { id: d.id, ...d.data() } as IContracts & { id: string };
                    let influencer: IUsers | null = null;
                    try {
                        const userSnap = await getDoc(doc(FirestoreDB, "users", contract.userId));
                        if (userSnap.exists()) influencer = userSnap.data() as IUsers;
                    } catch {
                        // non-critical
                    }
                    return { id: d.id, contract, influencer };
                })
            );

            results.sort((a, b) => {
                const aLevel = a.contract.slaWarnings?.some((w) => w.level === "support_escalation") ? 0 : 1;
                const bLevel = b.contract.slaWarnings?.some((w) => w.level === "support_escalation") ? 0 : 1;
                return aLevel - bLevel;
            });

            setCards(results);
        } catch (e) {
            Console.error(e, "Error fetching escalation contracts");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterKey, slaOnly]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
    }, [fetchData]);

    return { cards, loading, refreshing, refresh };
}

function EscalationList({ statusFilter, emptyMessage, slaOnly = false }: { statusFilter: number[]; emptyMessage: string; slaOnly?: boolean }) {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { cards, loading, refreshing, refresh } = useEscalationContracts(statusFilter, slaOnly);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <FlatList
            data={cards}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            contentContainerStyle={cards.length === 0 ? styles.center : styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>{emptyMessage}</Text>}
            renderItem={({ item }) => (
                <Pressable
                    style={styles.card}
                    onPress={() => router.push(`/contract-details/${item.id}`)}
                >
                    <View style={styles.cardHeader}>
                        <Text style={styles.contractId} numberOfLines={1}>
                            Contract #{item.id.slice(-6).toUpperCase()}
                        </Text>
                        <Text style={styles.statusBadge}>
                            {normalizeStatus(item.contract.status) === ContractStatus.Disputed
                                ? "Disputed"
                                : normalizeStatus(item.contract.status) === ContractStatus.Cancelled
                                  ? "Cancelled"
                                  : `Status ${item.contract.status}`}
                        </Text>
                    </View>
                    <Text style={styles.influencerName}>
                        {item.influencer?.name ?? item.contract.userId}
                    </Text>
                    {item.contract.dispute && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Dispute type:</Text>
                            <Text style={styles.detailValue}>{item.contract.dispute.type ?? "—"}</Text>
                        </View>
                    )}
                    {item.contract.dispute?.description ? (
                        <Text style={styles.description} numberOfLines={2}>
                            {item.contract.dispute.description}
                        </Text>
                    ) : null}
                    {item.contract.slaWarnings && item.contract.slaWarnings.length > 0 && (
                        <View style={styles.slaWarningRow}>
                            <Text style={styles.slaWarningText}>
                                {item.contract.slaWarnings[item.contract.slaWarnings.length - 1].level === "support_escalation"
                                    ? "⚠ Support escalation sent"
                                    : "Nudge sent"}
                            </Text>
                        </View>
                    )}
                </Pressable>
            )}
        />
    );
}

const AdminEscalations = () => {
    const { manager } = useAuthContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    if (!manager?.isAdmin) {
        return (
            <AppLayout>
                <PageHeader title="Escalations" />
                <View style={styles.center}>
                    <Text style={styles.emptyText}>Access restricted to admin managers only.</Text>
                </View>
            </AppLayout>
        );
    }

    const tabs = [
        {
            id: "disputes",
            title: "Open Disputes",
            component: (
                <EscalationList
                    statusFilter={[ContractStatus.Disputed]}
                    emptyMessage="No open disputes."
                />
            ),
        },
        {
            id: "sla",
            title: "SLA Alerts",
            component: (
                <EscalationList
                    statusFilter={[
                        ContractStatus.ShipmentPending,
                        ContractStatus.DeliveryPending,
                        ContractStatus.DeliveryAcknowledgementPending,
                        ContractStatus.VideoPending,
                        ContractStatus.ReviewPending,
                        ContractStatus.PostingPending,
                        ContractStatus.SettlementPending,
                    ]}
                    emptyMessage="No SLA alerts at this time."
                    slaOnly={true}
                />
            ),
        },
        {
            id: "cancelled",
            title: "Cancelled",
            component: (
                <EscalationList
                    statusFilter={[ContractStatus.Cancelled]}
                    emptyMessage="No cancelled contracts."
                />
            ),
        },
    ];

    return (
        <AppLayout>
            <PageHeader title="Escalations" subtitle="Admin" />
            <View style={styles.flex1}>
                <TopTabNavigation tabs={tabs} />
            </View>
        </AppLayout>
    );
};

export default AdminEscalations;

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        flex1: { flex: 1 },
        center: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        listContent: {
            padding: 16,
            gap: 12,
        },
        emptyText: {
            color: colors.textSecondary,
            fontSize: 14,
            textAlign: "center",
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.secondaryBorder,
            padding: 14,
            gap: 6,
            marginBottom: 12,
        },
        cardHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "transparent",
        },
        contractId: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.textSecondary,
            flex: 1,
        },
        statusBadge: {
            fontSize: 11,
            fontWeight: "700",
            color: colors.errorBannerText,
            backgroundColor: colors.errorBannerBg,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 99,
            overflow: "hidden",
        },
        influencerName: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
        },
        detailRow: {
            flexDirection: "row",
            gap: 6,
            backgroundColor: "transparent",
        },
        detailLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            fontWeight: "600",
        },
        detailValue: {
            fontSize: 12,
            color: colors.text,
        },
        description: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        slaWarningRow: {
            backgroundColor: colors.errorBannerBg,
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
        },
        slaWarningText: {
            fontSize: 12,
            color: colors.errorBannerText,
            fontWeight: "600",
        },
    });
}
