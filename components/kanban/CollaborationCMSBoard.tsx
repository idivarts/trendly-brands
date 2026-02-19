import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useDroppable,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy
} from "@dnd-kit/sortable";
import { useTheme } from "@react-navigation/native";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CollaborationCard, type CollaborationCardData } from "./CollaborationCard";

export type KanbanCardT = CollaborationCardData;

export type KanbanColumnT = {
    id: string;
    title: string;
    cards: KanbanCardT[];
};

export default function CollaborationCMSBoard() {
    const [columns, setColumns] = useState<KanbanColumnT[]>([
        { id: "draft", title: "Draft Campaign", cards: [] },
        { id: "active", title: "Active Campaign", cards: [] },
        { id: "stopped", title: "Stopped Campaign", cards: [] },
        { id: "inactive", title: "Past Campaign", cards: [] },
        { id: "deleted", title: "Deleted Campaign", cards: [] },
    ]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    useEffect(() => {
        const fetchCollaborations = async () => {
            setError(null);
            setLoading(true);
            try {
                console.log("[Kanban] Fetching collaborations (all)");

                const collRef = collection(FirestoreDB, "collaborations");
                const snapshot = await getDocs(query(collRef, orderBy("timeStamp", "desc")));
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
                    });
                });
                console.log("[Kanban] Total collaborations", collabs.length);

                const grouped: Record<string, KanbanCardT[]> = {
                    draft: [],
                    active: [],
                    inactive: [],
                    stopped: [],
                    deleted: [],
                };
                collabs.forEach((collab) => {
                    const bucket = (collab.status || "draft").toLowerCase();
                    if (bucket === "active") grouped.active.push(collab);
                    else if (bucket === "stopped") grouped.stopped.push(collab);
                    else if (bucket === "deleted") grouped.deleted.push(collab);
                    else if (bucket === "inactive") grouped.inactive.push(collab);
                    else grouped.draft.push(collab);
                });
                console.log("[Kanban] Grouped counts", {
                    draft: grouped.draft.length,
                    active: grouped.active.length,
                    stopped: grouped.stopped.length,
                    deleted: grouped.deleted.length,
                });
                setColumns([
                    {
                        id: "draft",
                        title: `Draft Campaign (${grouped.draft.length})`,
                        cards: grouped.draft,
                    },
                    {
                        id: "active",
                        title: `Active Campaign (${grouped.active.length})`,
                        cards: grouped.active,
                    },

                    {
                        id: "stopped",
                        title: `Stopped Campaign (${grouped.stopped.length})`,
                        cards: grouped.stopped,
                    },
                    {
                        id: "inactive",
                        title: `Past Campaign (${grouped.inactive.length})`,
                        cards: grouped.inactive,
                    },
                    {
                        id: "deleted",
                        title: `Deleted Campaign (${grouped.deleted.length})`,
                        cards: grouped.deleted,
                    },
                ]);
            } catch (err: any) {
                console.warn("Failed to fetch collaborations", err);
                setError(err?.message || "Unable to load collaborations");
            } finally {
                setLoading(false);
            }
        };
        fetchCollaborations();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragOver = (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeIdVal = active.id as string;
        const overIdVal = over.id as string;

        const [activeColumnId] = activeIdVal.split(":");
        const [overColumnId] = overIdVal.split(":");

        if (activeColumnId === overColumnId) return;

        setColumns((cols) => {
            const activeColumn = cols.find((col) => col.id === activeColumnId);
            const overColumn = cols.find((col) => col.id === overColumnId);

            if (!activeColumn || !overColumn) return cols;

            const activeCard = activeColumn.cards.find((c) => activeIdVal.includes(c.id));
            if (!activeCard) return cols;

            const newColumns = cols.map((col) => {
                if (col.id === activeColumnId) {
                    return {
                        ...col,
                        cards: col.cards.filter((c) => !activeIdVal.includes(c.id)),
                    };
                }
                if (col.id === overColumnId) {
                    return {
                        ...col,
                        cards: [...col.cards, activeCard],
                    };
                }
                return col;
            });

            return newColumns;
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activeIdVal = active.id as string;
        const overIdVal = over.id as string;

        const [fromColumnId, fromCardId] = activeIdVal.split(":");

        const toColumn = columns.find((c) => c.id === overIdVal);
        const toColumnId = toColumn ? overIdVal : overIdVal.split(":")[0];
        const toCardId = toColumn ? null : overIdVal.split(":")[1];

        if (fromColumnId === toColumnId) {
            const col = columns.find((c) => c.id === fromColumnId);
            if (!col) return;
            const oldIndex = col.cards.findIndex((c) => c.id === fromCardId);
            const newIndex = col.cards.findIndex((c) => c.id === toCardId);
            if (oldIndex === -1 || newIndex === -1) return;
            const updated = columns.map((c) =>
                c.id === col.id
                    ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) }
                    : c
            );
            setColumns(updated);
        } else {
            const from = columns.find((c) => c.id === fromColumnId);
            const to = columns.find((c) => c.id === toColumnId);
            if (!from || !to) return;

            try {
                const collabRef = doc(FirestoreDB, "collaborations", fromCardId);
                await updateDoc(collabRef, { status: to.id });
            } catch (err) {
                console.warn("Failed to update collaboration status", err);
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Collaboration CMS</Text>
            </View>

            {loading && (
                <Text style={{ paddingVertical: 8, opacity: 0.7 }}>
                    Loading collaborations…
                </Text>
            )}
            {error && (
                <Text style={{ color: colors.red, marginBottom: 8 }}>{error}</Text>
            )}

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                nestedScrollEnabled
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
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
    const bgColor = isOver ? colors.aliceBlue : colors.aliceBlue;

    return (
        <View
            ref={setNodeRef as any}
            style={[styles.column, { backgroundColor: bgColor }]}
        >
            <View style={styles.columnHeader}>
                <Text
                    style={[styles.columnTitle, { maxWidth: "60%" }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {column.title}
                </Text>
            </View>

            <SortableContext
                items={column.cards.map((c) => `${column.id}:${c.id}`)}
                strategy={rectSortingStrategy}
            >
                {column.cards.map((card) => (
                    <CollaborationCard
                        key={card.id}
                        id={`${column.id}:${card.id}`}
                        card={card}
                        colId={column.id}
                    />
                ))}
            </SortableContext>

            {column.cards.length === 0 && (
                <Text style={{ textAlign: "center", opacity: 0.6 }}>
                    Drop here to move card
                </Text>
            )}
        </View>
    );
};



const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        container: { flex: 1, padding: 20, backgroundColor: colors.white },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
        },
        title: { fontSize: 22, fontWeight: "700" },
        addBtn: {
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
        },
        addBtnText: { color: colors.white, fontWeight: "700" },
        row: {
            flexDirection: "row",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "nowrap",
            // overflowX: "auto",
        },
        column: {
            borderRadius: 12,
            padding: 12,
            width: 280,
            shadowColor: colors.black,
            shadowOpacity: 0.1,
            shadowRadius: 6,
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
        columnTitle: { fontSize: 16, fontWeight: "700" },
    });
