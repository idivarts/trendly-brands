import { View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { Campaign } from "@/types/Campaign";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import {
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
} from "react-native";
import CampaignCard from "./campaign-card/CampaignCard";

interface CampaignsListProps {
    active: boolean;
}

const CampaignsList: React.FC<CampaignsListProps> = ({ active }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);
    const { selectedBrand } = useBrandContext();

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!selectedBrand) return;

        const statusFilter = active
            ? ["active", "draft"]
            : ["past"];

        const q = query(
            collection(FirestoreDB, "campaigns"),
            where("brandId", "==", selectedBrand.id),
            where("status", "in", statusFilter),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                setCampaigns(
                    snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
                );
                setIsLoading(false);
            },
            (err) => {
                Console.error(err, "CampaignsList snapshot error");
                setIsLoading(false);
            }
        );

        return unsub;
    }, [selectedBrand?.id, active]);

    // If no campaigns exist at all (not just this filter), redirect to creation
    useEffect(() => {
        if (isLoading || !active || !selectedBrand) return;
        if (campaigns.length > 0) return;

        const q = query(
            collection(FirestoreDB, "campaigns"),
            where("brandId", "==", selectedBrand.id),
            limit(1)
        );
        const unsub = onSnapshot(q, (snap) => {
            if (snap.empty) {
                router.replace("/create-campaign");
            }
        });
        return unsub;
    }, [isLoading, campaigns.length, active, selectedBrand?.id]);

    const handleRefresh = () => {
        setRefreshing(true);
        // onSnapshot is live — we just flash the indicator briefly
        setTimeout(() => setRefreshing(false), 600);
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (campaigns.length === 0) {
        return (
            <EmptyState
                image={require("@/assets/images/illustration6.png")}
                title={active ? "No active campaigns" : "No past campaigns"}
                subtitle={
                    active
                        ? "Start your first campaign to reach thousands of creators."
                        : "Completed campaigns will appear here."
                }
                action={active ? () => router.push("/create-campaign") : undefined}
                actionLabel="Create Campaign"
            />
        );
    }

    return (
        <View style={styles.root}>
            <FlatList
                data={campaigns}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <CampaignCard
                        campaign={item}
                        onPress={() =>
                            router.push(`/campaign-details/${item.id}`)
                        }
                    />
                )}
                contentContainerStyle={styles.listContent}
                style={styles.list}
                numColumns={xl ? 2 : 1}
                {...(xl && { columnWrapperStyle: styles.columnWrapper })}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {!xl && (
                <View style={styles.fab}>
                    <Button
                        mode="contained"
                        onPress={() => router.push("/create-campaign")}
                        icon={({ size, color }) => (
                            <FontAwesomeIcon icon={faPlus} size={size ?? 16} color={color} />
                        )}
                    >
                        New Campaign
                    </Button>
                </View>
            )}
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        root: {
            flex: 1,
            position: "relative",
            backgroundColor: "transparent",
        },
        center: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        list: {
            flex: 1,
        },
        listContent: {
            padding: 16,
            gap: 16,
            paddingBottom: 80,
        },
        columnWrapper: {
            gap: 16,
        },
        fab: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingTop: 12,
            backgroundColor: "transparent",
        },
    });

export default CampaignsList;
