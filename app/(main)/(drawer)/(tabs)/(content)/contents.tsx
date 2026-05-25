import AddContentModal from "@/components/content-calendar/AddContentModal";
import { CalendarItem } from "@/components/content-calendar/types";
import ContentCard from "@/components/contents/ContentCard";
import EmptyContentsView from "@/components/contents/EmptyContentsView";
import { ContentItem } from "@/components/contents/types";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import { useContents } from "@/hooks/use-contents";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

type Tab = "active" | "archived";

const ContentsScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const router = useRouter();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const { items, addContent } = useContents();
    const [activeTab, setActiveTab] = useState<Tab>("active");
    const [showAddModal, setShowAddModal] = useState(false);

    const displayedItems = useMemo(
        () => items.filter((i) => (activeTab === "active" ? !i.isArchived : i.isArchived)),
        [items, activeTab]
    );

    const handleAddFromFresh = async (calItem: Omit<CalendarItem, "id">) => {
        const newId = await addContent(calItem);
        if (!newId) return;
        router.push({
            pathname: "/(main)/(drawer)/(secondary)/create-content" as any,
            params: { contentId: newId },
        });
    };

    const handleOpenContent = (item: ContentItem) => {
        router.push({
            pathname: "/(main)/(drawer)/(secondary)/create-content" as any,
            params: { contentId: item.id },
        });
    };

    const addButton = (
        <Pressable
            key="add"
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={() => setShowAddModal(true)}
        >
            <FontAwesomeIcon icon={faPlus} size={14} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>Create Content</Text>
        </Pressable>
    );

    return (
        <AppLayout>
            <PageHeader
                title="All Content"
                subtitle="Manage your drafts, reviews, and approved pieces"
                showBackButton={false}
                actionButtons={items.length > 0 ? [addButton] : []}
                mobileActions="all"
            />

            {items.length === 0 ? (
                <EmptyContentsView
                    onGoToStrategy={() =>
                        router.push("/(main)/(drawer)/(tabs)/(content)/content-strategies" as any)
                    }
                    onCreateContent={() => setShowAddModal(true)}
                />
            ) : (
                <View style={styles.flex1}>
                    <View style={styles.tabBar}>
                        {(["active", "archived"] as Tab[]).map((tab) => (
                            <Pressable
                                key={tab}
                                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text
                                    style={[
                                        styles.tabLabel,
                                        activeTab === tab && styles.tabLabelActive,
                                    ]}
                                >
                                    {tab === "active" ? "Active" : "Archived"}
                                </Text>
                                <View
                                    style={[
                                        styles.tabCount,
                                        activeTab === tab && styles.tabCountActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.tabCountText,
                                            activeTab === tab && styles.tabCountTextActive,
                                        ]}
                                    >
                                        {items.filter((i) =>
                                            tab === "active" ? !i.isArchived : i.isArchived
                                        ).length}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    {displayedItems.length === 0 ? (
                        <View style={styles.emptyTab}>
                            <Text style={styles.emptyTabText}>
                                {activeTab === "active"
                                    ? "No active content. Create something!"
                                    : "No archived content."}
                            </Text>
                            {activeTab === "active" && (
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.addBtn,
                                        styles.addBtnCentered,
                                        pressed && styles.addBtnPressed,
                                    ]}
                                    onPress={() => setShowAddModal(true)}
                                >
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        size={13}
                                        color={colors.onPrimary}
                                    />
                                    <Text style={styles.addBtnText}>Create Content</Text>
                                </Pressable>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={displayedItems}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <ContentCard item={item} onPress={handleOpenContent} />
                            )}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            )}

            <AddContentModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddFromFresh}
            />
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    const maxWidth = xl ? 860 : undefined;
    return useMemo(
        () =>
            StyleSheet.create({
                flex1: {
                    flex: 1,
                    paddingTop: 16,
                    paddingBottom: 40,
                    ...(maxWidth ? { maxWidth, alignSelf: "center" as const, width: "100%" } : {}),
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
                addBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                addBtnCentered: {
                    paddingHorizontal: 20,
                    paddingVertical: 11,
                },
                addBtnPressed: {
                    opacity: 0.75,
                },
                addBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
            }),
        [colors, xl]
    );
}

export default ContentsScreen;
