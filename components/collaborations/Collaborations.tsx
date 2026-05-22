import AddContentModal from "@/components/content-calendar/AddContentModal";
import { CalendarItem } from "@/components/content-calendar/types";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import { IS_LIVE } from "@/shared-libs/utils/environment";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import {
    collection,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import CollaborationCard, { CollaborationCardItem } from "./CollaborationCard";
import { CollabContentSource } from "./CreateCollabFromContentModal";
import ContentPickerModal from "./ContentPickerModal";
import CreateCollabFromContentModal from "./CreateCollabFromContentModal";
import EmptyCollaborationsView from "./EmptyCollaborationsView";

type Tab = "active" | "archived";

const ACTIVE_STATUSES = ["active", "draft", "stopped"];
const ARCHIVED_STATUSES = ["inactive"];

const CollaborationsV2 = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const { selectedBrand } = useBrandContext();

    const [allCollabs, setAllCollabs] = useState<CollaborationCardItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("active");

    const [showAddModal, setShowAddModal] = useState(false);
    const [showContentPicker, setShowContentPicker] = useState(false);
    const [collabSource, setCollabSource] = useState<CollabContentSource | null>(null);
    const [showCollabModal, setShowCollabModal] = useState(false);

    const handleCreateDirectly = () => setShowAddModal(true);
    const handleCreateFromContent = () => setShowContentPicker(true);

    const handleAddContent = (item: Omit<CalendarItem, "id">) => {
        const newId = `content-${Date.now()}`;
        router.push({
            pathname: "/(main)/(drawer)/(secondary)/create-content" as any,
            params: { contentId: newId, title: item.title, idea: item.idea, type: item.type, date: item.date },
        });
    };

    const handleContentSelected = (source: CollabContentSource) => {
        setShowContentPicker(false);
        setCollabSource(source);
        setShowCollabModal(true);
    };

    const displayed = useMemo(() => {
        if (activeTab === "active") {
            return allCollabs.filter((c) => ACTIVE_STATUSES.includes(c.status));
        }
        return allCollabs.filter((c) => ARCHIVED_STATUSES.includes(c.status));
    }, [allCollabs, activeTab]);

    const tabCount = (tab: Tab) =>
        tab === "active"
            ? allCollabs.filter((c) => ACTIVE_STATUSES.includes(c.status)).length
            : allCollabs.filter((c) => ARCHIVED_STATUSES.includes(c.status)).length;

    const fetchCollabs = async () => {
        if (!selectedBrand) return;

        try {
            const collabCol = collection(FirestoreDB, "collaborations");
            const q = query(
                collabCol,
                where("brandId", "==", selectedBrand.id),
                where("isLive", "==", IS_LIVE),
                where("version", "==", 2),
                orderBy("timeStamp", "desc")
            );

            const unsubscribe = onSnapshot(
                q,
                async (snap) => {
                    const items = await Promise.all(
                        snap.docs.map(async (docSnap) => {
                            const data = { ...docSnap.data(), id: docSnap.id } as any;

                            const appSnap = await getDocs(
                                collection(FirestoreDB, "collaborations", data.id, "applications")
                            );
                            const apps = appSnap.docs.map((d) => d.data());
                            const accepted = apps.filter((a) => a.status === "accepted").length;

                            const invSnap = await getDocs(
                                collection(FirestoreDB, "collaborations", data.id, "invitations")
                            );

                            return {
                                id: data.id,
                                name: data.name,
                                description: data.description,
                                status: data.status,
                                promotionType: data.promotionType,
                                contentFormat: data.contentFormat,
                                platform: data.platform,
                                budget: data.budget,
                                timeStamp: data.timeStamp,
                                applications: apps.length,
                                invitations: invSnap.size,
                                acceptedApplications: accepted,
                                version: data.version,
                            } as CollaborationCardItem;
                        })
                    );
                    setAllCollabs(items);
                    setIsLoading(false);
                },
                () => {
                    setIsLoading(false);
                }
            );

            return unsubscribe;
        } catch (err) {
            Console.error(err, "Error fetching v2 collaborations");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        fetchCollabs().then((unsub) => {
            unsubscribe = unsub;
        });
        return () => {
            unsubscribe?.();
        };
    }, [selectedBrand?.id]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchCollabs();
        setRefreshing(false);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (allCollabs.length === 0) {
        return (
            <>
                <EmptyCollaborationsView
                    onCreateFromContent={handleCreateFromContent}
                    onCreateDirectly={handleCreateDirectly}
                />
                <AddContentModal
                    visible={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddContent}
                />
                <ContentPickerModal
                    visible={showContentPicker}
                    onClose={() => setShowContentPicker(false)}
                    onSelect={handleContentSelected}
                />
                <CreateCollabFromContentModal
                    visible={showCollabModal}
                    content={collabSource}
                    onClose={() => { setShowCollabModal(false); setCollabSource(null); }}
                />
            </>
        );
    }

    return (
        <View style={styles.root}>
            <AddContentModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddContent}
            />
            <ContentPickerModal
                visible={showContentPicker}
                onClose={() => setShowContentPicker(false)}
                onSelect={handleContentSelected}
            />
            <CreateCollabFromContentModal
                visible={showCollabModal}
                content={collabSource}
                onClose={() => { setShowCollabModal(false); setCollabSource(null); }}
            />
            <View style={styles.tabBar}>
                {(["active", "archived"] as Tab[]).map((tab) => (
                    <Pressable
                        key={tab}
                        style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                            {tab === "active" ? "Active" : "Archived"}
                        </Text>
                        <View style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, activeTab === tab && styles.tabCountTextActive]}>
                                {tabCount(tab)}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </View>

            {displayed.length === 0 ? (
                <View style={styles.emptyTab}>
                    <Text style={styles.emptyTabText}>
                        {activeTab === "active"
                            ? "No active collaborations. Create one!"
                            : "No archived collaborations."}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={displayed}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CollaborationCard
                            item={item}
                            onPress={() => router.push(`/collaboration-details/${item.id}`)}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                        />
                    }
                />
            )}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                },
                loadingCenter: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                },
                tabBar: {
                    flexDirection: "row",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    gap: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                    zIndex: 2,
                    backgroundColor: colors.background,
                },
                tabItem: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                },
                tabItemActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                tabLabel: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                tabLabelActive: {
                    color: colors.onPrimary,
                },
                tabCount: {
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    paddingHorizontal: 5,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                },
                tabCountActive: {
                    backgroundColor: "rgba(255,255,255,0.25)",
                },
                tabCountText: {
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.textSecondary,
                },
                tabCountTextActive: {
                    color: colors.onPrimary,
                },
                list: {
                    paddingTop: 8,
                    paddingBottom: 32,
                },
                emptyTab: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    padding: 24,
                },
                emptyTabText: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                },
            }),
        [colors, xl]
    );
}

export default CollaborationsV2;
