import { useCollaborationContext } from "@/contexts/collaboration-context.provider";
import { IS_LIVE } from "@/shared-libs/utils/environment";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    PointerSensor,
    pointerWithin,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
    collection,
    getDocs,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Menu } from "react-native-paper";
import { CollaborationCard, type CollaborationCardData } from "./CollaborationCard";

export type CollaborationCMSLiveFilter = "none" | "live" | "not-live";

export type CollaborationCMSBoardProps = {
    liveFilter: CollaborationCMSLiveFilter;
};

export function CollaborationCMSCampaignFilter({
    liveFilter,
    onLiveFilterChange,
}: {
    liveFilter: CollaborationCMSLiveFilter;
    onLiveFilterChange: (value: CollaborationCMSLiveFilter) => void;
}) {
    const [menuVisible, setMenuVisible] = useState(false);
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useCampaignFilterStyles(colors), [colors]);

    return (
        <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
                <Pressable
                    onPress={() => setMenuVisible(true)}
                    style={styles.filterBtn}
                >
                    <Text style={styles.filterBtnText}>
                        {liveFilter === "none"
                            ? "All Campaigns"
                            : liveFilter === "live"
                                ? "Live Campaigns"
                                : "Not-Live Campaigns"}
                    </Text>
                </Pressable>
            }
        >
            <Menu.Item
                onPress={() => {
                    onLiveFilterChange("none");
                    setMenuVisible(false);
                }}
                title="None (All Campaigns)"
            />
            <Menu.Item
                onPress={() => {
                    onLiveFilterChange("live");
                    setMenuVisible(false);
                }}
                title="Live Campaigns"
            />
            <Menu.Item
                onPress={() => {
                    onLiveFilterChange("not-live");
                    setMenuVisible(false);
                }}
                title="Not-Live Campaigns"
            />
        </Menu>
    );
}

export type KanbanCardT = CollaborationCardData & { isLive?: boolean };

export type KanbanColumnT = {
    id: string;
    title: string;
    cards: KanbanCardT[];
};

export default function CollaborationCMSBoard({ liveFilter }: CollaborationCMSBoardProps) {
    const [columns, setColumns] = useState<KanbanColumnT[]>([
        { id: "draft", title: "Draft Campaign", cards: [] },
        { id: "active", title: "Active Campaign", cards: [] },
        { id: "stopped", title: "Stopped Campaign", cards: [] },
        { id: "inactive", title: "Past Campaign", cards: [] },
        { id: "deleted", title: "Deleted Campaign", cards: [] },
    ]);
    const [activeCard, setActiveCard] = useState<KanbanCardT | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [allCollaborations, setAllCollaborations] = useState<KanbanCardT[]>([]);
    const { updateCollaboration } = useCollaborationContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    useEffect(() => {
        const fetchCollaborations = async () => {
            setError(null);
            setLoading(true);
            try {
                console.log("[Kanban] Fetching collaborations", { isLive: IS_LIVE });

                const collRef = collection(FirestoreDB, "collaborations");
                const snapshot = await getDocs(
                    query(
                        collRef,
                        where("isLive", "==", IS_LIVE),
                        orderBy("timeStamp", "desc")
                    )
                );
                console.log("[Kanban] Collaborations found", snapshot.size);

                const collabs: KanbanCardT[] = [];
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data() as any;
                    collabs.push({
                        id: docSnap.id,
                        status: (data.status || "draft") as string,
                        message: data.message || data.name || "",
                        socialProfile: data.socialProfile,
                        timeStamp: data.timeStamp,
                        collaborationId: docSnap.id,
                        brandId: data.brandId,
                        isLive: data.isLive ?? false, // Default to false if not present
                    });
                });
                console.log("[Kanban] Total collaborations", collabs.length);
                setAllCollaborations(collabs);

            } catch (err: any) {
                console.warn("Failed to fetch collaborations", err);
                setError(err?.message || "Unable to load collaborations");
            } finally {
                setLoading(false);
            }
        };
        fetchCollaborations();
    }, []);

    const updateColumns = (collabs: KanbanCardT[], filter: CollaborationCMSLiveFilter) => {
        const grouped: Record<string, KanbanCardT[]> = {
            draft: [],
            active: [],
            inactive: [],
            stopped: [],
            deleted: [],
        };

        const filteredCollabs = collabs.filter((collab) => {
            if (filter === "none") return true;
            if (filter === "live") return collab.isLive === true;
            if (filter === "not-live") return !collab.isLive;
            return true;
        });

        filteredCollabs.forEach((collab) => {
            const bucket = (collab.status || "draft").toLowerCase();
            if (bucket === "active") grouped.active.push(collab);
            else if (bucket === "stopped") grouped.stopped.push(collab);
            else if (bucket === "deleted") grouped.deleted.push(collab);
            else if (bucket === "inactive") grouped.inactive.push(collab);
            else grouped.draft.push(collab);
        });

        setColumns([
            { id: "draft", title: `Draft (${grouped.draft.length})`, cards: grouped.draft },
            { id: "active", title: `Active (${grouped.active.length})`, cards: grouped.active },
            { id: "stopped", title: `Stopped (${grouped.stopped.length})`, cards: grouped.stopped },
            { id: "inactive", title: `Past (${grouped.inactive.length})`, cards: grouped.inactive },
            { id: "deleted", title: `Deleted (${grouped.deleted.length})`, cards: grouped.deleted },
        ]);
    };

    useEffect(() => {
        updateColumns(allCollaborations, liveFilter);
    }, [liveFilter, allCollaborations]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: any) => {
        const activeId = event.active.id as string;
        const [, cardId] = activeId.split(":");
        const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId) || null;
        setActiveCard(card);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);

        if (!over) return;

        const activeIdVal = active.id as string;
        const overIdVal = over.id as string;

        const [fromColumnId, fromCardId] = activeIdVal.split(":");

        // Determine drop column
        const isColumnDrop = !overIdVal.includes(":"); // Dropped on column container
        const toColumnId = isColumnDrop ? overIdVal : overIdVal.split(":")[0];
        const toCardId = isColumnDrop ? null : overIdVal.split(":")[1];

        // Find source and dest columns
        const sourceColIndex = columns.findIndex(c => c.id === fromColumnId);
        const destColIndex = columns.findIndex(c => c.id === toColumnId);
        
        if (sourceColIndex === -1 || destColIndex === -1) return;

        if (fromColumnId === toColumnId) {
            // Same column reorder
            const column = columns[sourceColIndex];
            const oldIndex = column.cards.findIndex(c => c.id === fromCardId);
            const newIndex = toCardId ? column.cards.findIndex(c => c.id === toCardId) : column.cards.length;

            if (oldIndex !== newIndex && oldIndex !== -1) {
                 const newCards = arrayMove(column.cards, oldIndex, newIndex);
                 const newColumns = [...columns];
                 newColumns[sourceColIndex] = { ...column, cards: newCards };
                 setColumns(newColumns);
            }
        } else {
            // Move between columns
            const sourceCol = columns[sourceColIndex];
            const destCol = columns[destColIndex];
            const card = sourceCol.cards.find(c => c.id === fromCardId);
            
            if (!card) return;

            const newSourceCards = sourceCol.cards.filter(c => c.id !== fromCardId);
            const newDestCards = [...destCol.cards];
            
            const insertIndex = toCardId 
                ? newDestCards.findIndex(c => c.id === toCardId)
                : newDestCards.length;
            
            // Insert at index
            newDestCards.splice(insertIndex < 0 ? newDestCards.length : insertIndex, 0, card);

            const newColumns = [...columns];
            newColumns[sourceColIndex] = { ...sourceCol, cards: newSourceCards };
            newColumns[destColIndex] = { ...destCol, cards: newDestCards };
            
            setColumns(newColumns);

            try {
                await updateCollaboration(fromCardId, { status: toColumnId }, { skipEvaluation: true });
            } catch (err) {
                console.warn("Failed to update collaboration status", err);
            }
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
             <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {loading && (
                    <Text style={{ paddingVertical: 8, opacity: 0.7, color: colors.textSecondary }}>
                        Loading collaborations…
                    </Text>
                )}
                {error && (
                    <Text style={{ color: colors.red, marginBottom: 8 }}>{error}</Text>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin} // Switched to pointerWithin like BrandCRMBoard
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <DragOverlay>
                        {activeCard ? (
                             <View
                                style={{
                                    padding: 12,
                                    borderRadius: 8,
                                    backgroundColor: colors.card,
                                    boxShadow: `0px 8px 24px ${colors.cardShadow}`,
                                    width: 260,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                }}
                            >
                                <Text style={{ fontWeight: "700", color: colors.text }}>
                                    {activeCard.message || "Unknown Campaign"}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>ID: {activeCard.id}</Text>
                            </View>
                        ) : null}
                    </DragOverlay>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20, paddingRight: 16 }}
                        nestedScrollEnabled
                    >
                        <View style={styles.row}>
                            {columns.map((col) => (
                                <DroppableColumn key={col.id} column={col} />
                            ))}
                        </View>
                    </ScrollView>
                </DndContext>
            </ScrollView>
        </View>
    );
}

const DroppableColumn = ({ column }: { column: KanbanColumnT }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
    const columnBg = theme.dark
        ? isOver
            ? colors.secondarySurface
            : colors.glassTabBarSurface
        : isOver
            ? colors.primaryLight
            : colors.aliceBlue;

    return (
        <View
            ref={setNodeRef as any}
            style={[styles.column, { backgroundColor: columnBg }]}
        >
            <View style={styles.columnHeader}>
                <Text
                    style={[styles.columnTitle, { maxWidth: "60%" }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {column.title.split(" (")[0]} ({column.cards.length})
                </Text>
            </View>

            <ScrollView
                style={styles.columnScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
            >
                <SortableContext
                    items={column.cards.map((c) => `${column.id}:${c.id}`)}
                    strategy={rectSortingStrategy}
                >
                    {column.cards.map((card) => (
                        <SortableCollaborationCard
                            key={card.id}
                            id={`${column.id}:${card.id}`}
                            card={card}
                            colId={column.id}
                        />
                    ))}
                </SortableContext>

                {column.cards.length === 0 && (
                    <Text
                        style={{
                            textAlign: "center",
                            opacity: 0.7,
                            marginTop: 20,
                            color: colors.textSecondary,
                        }}
                    >
                        Drop here to move card
                    </Text>
                )}
            </ScrollView>
        </View>
    );
};

const SortableCollaborationCard = ({
    id,
    card,
    colId,
}: {
    id: string;
    card: KanbanCardT;
    colId: string;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isOver,
    } = useSortable({ id });
    const router = useRouter();
    const theme = useTheme();
    const colors = Colors(theme);

    // Filter out web-specific attributes
    const { tabIndex, role, ...restAttributes } = attributes as any;
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    // Using inline style specifically to avoid "touchAction: none" which blocks scrolling
    // and to match BrandCRMBoard's structure wrapper
    
    return (
         <View
            ref={setNodeRef as any}
            {...restAttributes}
            {...listeners}
            style={[
                {
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor: colors.transparent, // Wrapper is transparent, card handling bg
                    position: "relative",
                    opacity: isOver ? 0.5 : 1, // Simple visual feedback for source
                    // touchAction: "none" <-- OMITTED to enable scrolling
                },
                style
            ]}
        >
            {/* Drop Indicator Logic like BrandCRMBoard */}
            {isOver && (
                <View
                    style={{
                        position: "absolute",
                        top: -4,
                        left: 0,
                        right: 0,
                        height: 3,
                        backgroundColor: colors.primary,
                        borderRadius: 2,
                        zIndex: 10,
                    }}
                />
            )}
            
            <Pressable
                onPress={() => {
                     console.log("[CollaborationCMSBoard] Opening collaboration:", card.id);
                     router.push(`/collaboration-details/${card.id}`);
                }}
            >
                <CollaborationCard
                    id={id}
                    card={card}
                    colId={colId}
                />
            </Pressable>
        </View>
    );
}

const useCampaignFilterStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        filterBtn: {
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
        },
        filterBtnText: { color: colors.white, fontWeight: "600", fontSize: 14 },
    });

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        container: { flex: 1, padding: 20, backgroundColor: colors.background },
        row: {
            flexDirection: "row",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "nowrap",
        },
        column: {
            borderRadius: 12,
            padding: 12,
            width: 280,
            minHeight: 500, // Added min/max height to allow column scrolling
            maxHeight: 900,
            shadowColor: colors.black,
            shadowOpacity: 0.1,
            shadowRadius: 6,
            flexShrink: 0,
        },
        columnHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomWidth: 1,
            borderColor: colors.border,
            paddingBottom: 8,
            marginBottom: 8,
        },
        columnTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
        columnScroll: {
            flex: 1,
            paddingBottom: 8,
        },
    });
