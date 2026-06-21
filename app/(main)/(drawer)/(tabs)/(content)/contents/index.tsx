import AddContentModal, { AddContentExtras } from "@/components/content-calendar/AddContentModal";
import { CalendarItem } from "@/components/content-calendar/types";
import ContentBoard from "@/components/contents/ContentBoard";
import ContentGallery from "@/components/contents/ContentGallery";
import ContentStateFilter, {
    ContentStateFilterValue,
} from "@/components/contents/ContentStateFilter";
import ContentViewSwitcher, { ContentView } from "@/components/contents/ContentViewSwitcher";
import ContentsOverflowMenu from "@/components/contents/ContentsOverflowMenu";
import EmptyContentsView from "@/components/contents/EmptyContentsView";
import { useSidebarParam } from "@/components/drawer-layout/use-sidebar-param";
import {
    CONTENT_STATUS_ORDER,
    ContentItem,
    ContentStatus,
    postingTime,
} from "@/components/contents/types";
import { GUIDE_TOUR_CONTENT_WEB } from "@/components/guide-tour/guide-tour-config";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import { useContents } from "@/hooks/use-contents";
import { useFeatureTour } from "@/hooks/use-feature-tour";
import { CoachmarkAnchor } from "@edwardloopez/react-native-coachmark";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

const ContentsScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const router = useRouter();
    const styles = useStyles(colors);
    useSidebarParam();

    const { items, addContent, updateContent } = useContents();
    // Default to the Board on desktop (xl); mobile is always forced to Gallery
    // via effectiveView below regardless of this initial value.
    const [view, setView] = useState<ContentView>("board");
    const [stateFilter, setStateFilter] = useState<ContentStateFilterValue>("all");
    const [showAddModal, setShowAddModal] = useState(false);

    // Arriving from /onboarding ("Work on a specific content") opens the create
    // modal straight away. Applied once so closing it doesn't re-trigger.
    const { openCreate } = useLocalSearchParams<{ openCreate?: string }>();
    const openedFromParam = useRef(false);
    useEffect(() => {
        if (openedFromParam.current || openCreate !== "1") return;
        openedFromParam.current = true;
        setShowAddModal(true);
    }, [openCreate]);

    // The Board is desktop-only — on mobile we always render the Gallery.
    const effectiveView: ContentView = xl ? view : "gallery";

    // Coach mark: teach the Board/Gallery switcher (web only) once content loads.
    useFeatureTour({
        feature: "content",
        ready: items.length > 0,
        web: GUIDE_TOUR_CONTENT_WEB,
    });

    const activeItems = useMemo(() => items.filter((i) => !i.isArchived), [items]);

    // Counts for the Board's trailing terminal-state pills. Scheduled/Posted are
    // active (non-archived) by status; Archived is the isArchived flag regardless
    // of status.
    const terminalCounts = useMemo(
        () => ({
            scheduled: activeItems.filter((i) => i.status === "scheduled").length,
            posted: activeItems.filter((i) => i.status === "posted").length,
            archived: items.filter((i) => i.isArchived).length,
        }),
        [activeItems, items]
    );

    const galleryItems = useMemo(() => {
        const filtered =
            stateFilter === "all"
                ? activeItems
                : activeItems.filter((i) => i.status === stateFilter);
        // Sort by posting date ascending — earliest first, matching Board View.
        return [...filtered].sort((a, b) => postingTime(a) - postingTime(b));
    }, [activeItems, stateFilter]);

    const handleAddFromFresh = async (
        calItem: Omit<CalendarItem, "id">,
        extras: AddContentExtras
    ) => {
        const newId = await addContent(calItem, { platforms: extras.platforms });
        if (!newId) return;
        router.push({
            pathname: "/(main)/(drawer)/(tabs)/(content)/contents/[contentId]" as any,
            params: { contentId: newId },
        });
    };

    const handleOpenContent = (item: ContentItem) => {
        router.push(`/contents/${item.id}`);
    };

    const handleChangeStatus = (id: string, status: ContentStatus) =>
        updateContent(id, { status: status as any });

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

    // Switcher is xl-only; the overflow menu is available on every breakpoint.
    const viewingButtons = [
        ...(xl
            ? [
                <CoachmarkAnchor
                    key="switcher"
                    id="gt-content-view-switcher"
                    shape="rect"
                >
                    <ContentViewSwitcher value={view} onChange={setView} />
                </CoachmarkAnchor>,
            ]
            : []),
        <ContentsOverflowMenu key="overflow" />,
    ];

    return (
        <AppLayout>
            <PageHeader
                title="Content"
                subtitle="Manage your drafts, reviews, and approved pieces"
                showBackButton={false}
                viewingActionButtons={items.length > 0 ? viewingButtons : []}
                workflowActionButtons={items.length > 0 ? [addButton] : []}
                mobileActions="all"
            />

            {items.length === 0 ? (
                <EmptyContentsView
                    onGoToStrategy={() =>
                        router.push(
                            "/(main)/(drawer)/(tabs)/(content)/content-strategies" as any
                        )
                    }
                    onCreateContent={() => setShowAddModal(true)}
                />
            ) : (
                <View style={styles.flex1}>
                    {effectiveView === "gallery" ? (
                        <>
                            <View style={styles.filterBar}>
                                <ContentStateFilter
                                    items={activeItems}
                                    statuses={CONTENT_STATUS_ORDER}
                                    value={stateFilter}
                                    onChange={setStateFilter}
                                />
                            </View>
                            <ContentGallery
                                items={galleryItems}
                                onPressItem={handleOpenContent}
                                emptyText="No content matches this filter."
                            />
                        </>
                    ) : (
                        <ContentBoard
                            items={activeItems}
                            onChangeStatus={handleChangeStatus}
                            onPressItem={handleOpenContent}
                            terminalCounts={terminalCounts}
                            onOpenTerminal={(path) => router.push(path as any)}
                        />
                    )}
                </View>
            )}

            <AddContentModal
                visible={showAddModal}
                source="contents"
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddFromFresh}
            />
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                flex1: {
                    flex: 1,
                },
                filterBar: {
                    backgroundColor: colors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                    zIndex: 2,
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
                addBtnPressed: {
                    opacity: 0.75,
                },
                addBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
            }),
        [colors]
    );
}

export default ContentsScreen;
