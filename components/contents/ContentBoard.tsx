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
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ContentBoardCard from "./ContentBoardCard";
import {
    BOARD_CONTENT_STATUSES,
    CONTENT_STATUS_LABELS,
    ContentItem,
    ContentStatus,
} from "./types";

interface ContentBoardProps {
    /** Active (non-archived) items. Only the 4 authoring statuses are shown. */
    items: ContentItem[];
    /** Persist a status change after a cross-column drag. */
    onChangeStatus: (id: string, status: ContentStatus) => Promise<void> | void;
    onPressItem: (item: ContentItem) => void;
}

type BoardColumn = {
    id: ContentStatus;
    title: string;
    cards: ContentItem[];
};

function buildColumns(items: ContentItem[]): BoardColumn[] {
    return BOARD_CONTENT_STATUSES.map((status) => ({
        id: status,
        title: CONTENT_STATUS_LABELS[status],
        cards: items.filter((i) => i.status === status),
    }));
}

/**
 * Kanban board for the content authoring funnel (Draft → In Progress → Review →
 * Approved). Mirrors the Collaboration-CMS board. Desktop-only — the host page
 * does not render it on mobile.
 */
const ContentBoard: React.FC<ContentBoardProps> = ({ items, onChangeStatus, onPressItem }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const [columns, setColumns] = useState<BoardColumn[]>(() => buildColumns(items));
    const [activeCard, setActiveCard] = useState<ContentItem | null>(null);
    // Measured height of the board area. Columns are capped to this so the
    // column's own vertical scroll (not the page) is the scroll boundary and
    // stays fully on-screen — otherwise a tall column is clipped at the
    // viewport bottom with no way to reach its last cards.
    const [boardHeight, setBoardHeight] = useState(0);

    // boardScroll padding is 20 top + 20 bottom = 40px of chrome around columns.
    const columnMaxHeight = boardHeight > 0 ? Math.max(480, boardHeight - 40) : 900;

    // Keep columns in sync with the live items (Firestore snapshot updates).
    useEffect(() => {
        setColumns(buildColumns(items));
    }, [items]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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

        const [fromColumnId, fromCardId] = (active.id as string).split(":");
        const overId = over.id as string;
        const isColumnDrop = !overId.includes(":");
        const toColumnId = (isColumnDrop ? overId : overId.split(":")[0]) as ContentStatus;
        const toCardId = isColumnDrop ? null : overId.split(":")[1];

        const sourceColIndex = columns.findIndex((c) => c.id === fromColumnId);
        const destColIndex = columns.findIndex((c) => c.id === toColumnId);
        if (sourceColIndex === -1 || destColIndex === -1) return;

        if (fromColumnId === toColumnId) {
            // Same-column reorder (local only — order isn't persisted).
            const column = columns[sourceColIndex];
            const oldIndex = column.cards.findIndex((c) => c.id === fromCardId);
            const newIndex = toCardId
                ? column.cards.findIndex((c) => c.id === toCardId)
                : column.cards.length;
            if (oldIndex !== newIndex && oldIndex !== -1) {
                const newCards = arrayMove(column.cards, oldIndex, newIndex);
                const next = [...columns];
                next[sourceColIndex] = { ...column, cards: newCards };
                setColumns(next);
            }
            return;
        }

        // Cross-column move → optimistic update + persist new status.
        const sourceCol = columns[sourceColIndex];
        const destCol = columns[destColIndex];
        const card = sourceCol.cards.find((c) => c.id === fromCardId);
        if (!card) return;

        const newSourceCards = sourceCol.cards.filter((c) => c.id !== fromCardId);
        const newDestCards = [...destCol.cards];
        const insertIndex = toCardId ? newDestCards.findIndex((c) => c.id === toCardId) : newDestCards.length;
        newDestCards.splice(insertIndex < 0 ? newDestCards.length : insertIndex, 0, {
            ...card,
            status: toColumnId,
        });

        const next = [...columns];
        next[sourceColIndex] = { ...sourceCol, cards: newSourceCards };
        next[destColIndex] = { ...destCol, cards: newDestCards };
        setColumns(next);

        try {
            await onChangeStatus(fromCardId, toColumnId);
        } catch (err) {
            console.warn("Failed to update content status", err);
            // Revert to the source-of-truth on failure.
            setColumns(buildColumns(items));
        }
    };

    return (
        <View
            style={styles.wrapper}
            onLayout={(e) => setBoardHeight(e.nativeEvent.layout.height)}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <DragOverlay>
                    {activeCard ? (
                        <View style={styles.overlay}>
                            <ContentBoardCard item={activeCard} />
                        </View>
                    ) : null}
                </DragOverlay>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.boardScroll}
                    nestedScrollEnabled
                >
                    <View style={styles.row}>
                        {columns.map((col) => (
                            <DroppableColumn
                                key={col.id}
                                column={col}
                                maxHeight={columnMaxHeight}
                                onPressItem={onPressItem}
                            />
                        ))}
                    </View>
                </ScrollView>
            </DndContext>
        </View>
    );
};

const DroppableColumn = ({
    column,
    maxHeight,
    onPressItem,
}: {
    column: BoardColumn;
    maxHeight: number;
    onPressItem: (item: ContentItem) => void;
}) => {
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
        <View ref={setNodeRef as any} style={[styles.column, { backgroundColor: columnBg, maxHeight }]}>
            <View style={styles.columnHeader}>
                <Text style={styles.columnTitle} numberOfLines={1}>
                    {column.title}
                </Text>
                <View style={styles.columnCount}>
                    <Text style={styles.columnCountText}>{column.cards.length}</Text>
                </View>
            </View>

            <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <SortableContext
                    items={column.cards.map((c) => `${column.id}:${c.id}`)}
                    strategy={rectSortingStrategy}
                >
                    {column.cards.map((card) => (
                        <SortableContentCard
                            key={card.id}
                            id={`${column.id}:${card.id}`}
                            item={card}
                            onPressItem={onPressItem}
                        />
                    ))}
                </SortableContext>

                {column.cards.length === 0 && (
                    <Text style={styles.dropHint}>Drop here</Text>
                )}
            </ScrollView>
        </View>
    );
};

const SortableContentCard = ({
    id,
    item,
    onPressItem,
}: {
    id: string;
    item: ContentItem;
    onPressItem: (item: ContentItem) => void;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({ id });
    const { tabIndex, role, ...restAttributes } = attributes as any;

    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <View
            ref={setNodeRef as any}
            {...restAttributes}
            {...listeners}
            style={[{ marginBottom: 8, position: "relative", opacity: isOver ? 0.5 : 1 }, style]}
        >
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
            <Pressable onPress={() => onPressItem(item)}>
                <ContentBoardCard item={item} />
            </Pressable>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                wrapper: { flex: 1, backgroundColor: colors.background },
                boardScroll: { padding: 20, paddingRight: 16 },
                row: { flexDirection: "row", gap: 16, alignItems: "flex-start", flexWrap: "nowrap" },
                column: {
                    borderRadius: 12,
                    padding: 12,
                    width: 280,
                    minHeight: 480,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.06,
                    elevation: 2,
                    flexShrink: 0,
                },
                columnHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 10,
                    marginBottom: 8,
                },
                columnTitle: { fontSize: 15, fontWeight: "700", color: colors.text, flexShrink: 1 },
                columnCount: {
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                    paddingHorizontal: 6,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                },
                columnCountText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
                columnScroll: { flex: 1, paddingBottom: 8 },
                dropHint: {
                    textAlign: "center",
                    opacity: 0.6,
                    marginTop: 24,
                    color: colors.textSecondary,
                    fontSize: 13,
                },
                overlay: {
                    width: 260,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 0.18,
                    elevation: 8,
                },
            }),
        [colors]
    );
}

export default ContentBoard;
