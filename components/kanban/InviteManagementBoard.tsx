import { useAuthContext } from "@/contexts/auth-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@react-navigation/native";
import {
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { InfluencerItem } from "../discover/discover-types";

export type KanbanCardT = {
    id: string;
    status: string;
    message: string;
    socialProfile?: InfluencerItem;
    timeStamp?: number;
    collaborationId?: string;
};

export type KanbanColumnT = {
    id: string;
    title: string;
    cards: KanbanCardT[];
};

export default function InviteManagementBoard() {
    const [columns, setColumns] = useState<KanbanColumnT[]>([
        { id: "waiting", title: "Waiting", cards: [] },
        { id: "accepted", title: "Accepted", cards: [] },
        { id: "declined", title: "Declined", cards: [] },
    ]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { manager } = useAuthContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    useEffect(() => {
        const fetchInvites = async () => {
            setError(null);
            setLoading(true);
            try {
                console.log("[Kanban] Fetching invites. managerId:", manager?.id);

                const collectionsToTry = ["collaborations-invites"];
                let snapshot = null;
                let usedCollection = "";
                let usedConstraintLabel = "";

                for (const colName of collectionsToTry) {
                    const colRef = collection(FirestoreDB, colName);
                    const candidateQueries = [
                        manager?.id
                            ? {
                                label: `${colName} isDiscover=true managerId=${manager.id}`,
                                q: query(
                                    colRef,
                                    where("isDiscover", "==", true),
                                    where("managerId", "==", manager.id)
                                ),
                            }
                            : null,
                        {
                            label: `${colName} isDiscover=true (no manager filter)`,
                            q: query(colRef, where("isDiscover", "==", true)),
                        },
                    ].filter(Boolean) as { label: string; q: any }[];

                    for (const { label, q } of candidateQueries) {
                        console.log("[Kanban] Running query", label);
                        const snap = await getDocs(q);
                        console.log("[Kanban] Query size", snap.size);
                        if (!snap.empty) {
                            snapshot = snap;
                            usedCollection = colName;
                            usedConstraintLabel = label;
                            break;
                        }
                    }
                    if (snapshot) break;
                }

                if (!snapshot) throw new Error("No invites found in tried collections");
                console.log("[Kanban] Using collection", usedCollection, "query", usedConstraintLabel);

                const invites: KanbanCardT[] = [];
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data() as any;
                    console.log("[Kanban] Doc", docSnap.id, data);
                    invites.push({
                        id: docSnap.id,
                        status: data.status || "waiting",
                        message: data.message || "",
                        socialProfile: data.socialProfile,
                        timeStamp: data.timeStamp,
                        collaborationId: data.collaborationId,
                    });
                });
                console.log("[Kanban] Total invites", invites.length);

                const grouped: Record<string, KanbanCardT[]> = {
                    waiting: [],
                    accepted: [],
                    declined: [],
                };
                invites.forEach((inv) => {
                    const bucket = (inv.status || "waiting").toLowerCase();
                    if (bucket === "accepted") grouped.accepted.push(inv);
                    else if (
                        bucket === "declined" ||
                        bucket === "denied" ||
                        bucket === "inactive"
                    )
                        grouped.declined.push(inv);
                    else grouped.waiting.push(inv);
                });
                console.log("[Kanban] Grouped counts", {
                    waiting: grouped.waiting.length,
                    accepted: grouped.accepted.length,
                    declined: grouped.declined.length,
                });
                setColumns([
                    {
                        id: "waiting",
                        title: `Waiting (${grouped.waiting.length})`,
                        cards: grouped.waiting,
                    },
                    {
                        id: "accepted",
                        title: `Accepted (${grouped.accepted.length})`,
                        cards: grouped.accepted,
                    },
                    {
                        id: "declined",
                        title: `Declined (${grouped.declined.length})`,
                        cards: grouped.declined,
                    },
                ]);
            } catch (err: any) {
                console.warn("Failed to fetch invites", err);
                setError(err?.message || "Unable to load invites");
            } finally {
                setLoading(false);
            }
        };
        fetchInvites();
    }, [manager?.id]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const [fromColumnId, fromCardId] = (active.id as string).split(":");
        const [toColumnId, toCardId] = (over.id as string).split(":");

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
            const card = from.cards.find((c) => c.id === fromCardId);
            if (!card) return;

            const fromCards = from.cards.filter((c) => c.id !== fromCardId);
            const updatedCard = { ...card, status: to.id };
            const toCards = [...to.cards, updatedCard];

            const updated = columns.map((c) =>
                c.id === from.id
                    ? { ...c, cards: fromCards }
                    : c.id === to.id
                        ? { ...c, cards: toCards }
                        : c
            );
            setColumns(updated);

            try {
                // Persist to primary collection name (collaborations-invites)
                const inviteRef = doc(FirestoreDB, "collaborations-invites", card.id);
                await updateDoc(inviteRef, { status: to.id });
            } catch (err) {
                console.warn("Failed to update invite status", err);
            }
        }
        setActiveId(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Trendly Admin Invites</Text>
            </View>

            {loading && (
                <Text style={{ paddingVertical: 8, opacity: 0.7 }}>
                    Loading invites…
                </Text>
            )}
            {error && (
                <Text style={{ color: colors.red, marginBottom: 8 }}>{error}</Text>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    <View style={styles.row}>
                        {columns.map((col) => (
                            <DroppableColumn key={col.id} column={col} />
                        ))}
                    </View>
                </ScrollView>
            </DndContext>
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
                    <SortableCard
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

const SortableCard = ({
    id,
    card,
    colId,
}: {
    id: string;
    card: KanbanCardT;
    colId: string;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    return (
        // @ts-ignore
        <View
            ref={setNodeRef as any}
            {...attributes}
            {...listeners}
            style={[
                styles.card,
                style,
                {
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: 8,
                },
            ]}
        >
            <Text style={styles.cardTitle}>
                {card.socialProfile?.name || "Unknown"}{" "}
                <Text style={{ fontWeight: "400", opacity: 0.7 }}>
                    @{card.socialProfile?.username || ""}
                </Text>
            </Text>
            <Text style={[styles.cardDesc, { marginBottom: 4 }]}>
                Status: {colId.charAt(0).toUpperCase() + colId.slice(1)}
            </Text>
            {card.collaborationId && (
                <Text style={[styles.cardDesc, { marginBottom: 4 }]}>
                    Collaboration: {card.collaborationId}
                </Text>
            )}
            <Text style={styles.cardDesc} numberOfLines={3} ellipsizeMode="tail">
                {card.message || "No message"}
            </Text>
            <Text style={[styles.cardDesc, { marginTop: 6 }]}>
                Followers: {card.socialProfile?.follower_count ?? "-"} | ER:{" "}
                {card.socialProfile?.engagement_rate?.toFixed?.(2) ?? "-"}%
            </Text>
            {card.timeStamp && (
                <Text style={[styles.cardDesc, { marginTop: 4, opacity: 0.7 }]}>
                    Invited: {new Date(card.timeStamp).toLocaleDateString()}
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
        card: {
            backgroundColor: colors.white,
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
        },
        cardTitle: {
            fontWeight: "600",
            // borderBottomWidth: 1
            // borderColor: "#D1D5DB",
            paddingBottom: 4,
            marginBottom: 4,
        },
        cardDesc: {
            marginTop: 0,
            color: colors.text,
        },
    });
