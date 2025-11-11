import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DraxList, DraxProvider, DraxSnapbackTargetPreset, DraxView } from "react-native-drax";

/**
 * KanbanBoard.tsx — Expo/React Native component
 * Drag cards between columns (and reorder within a column).
 *
 * Dependencies (Expo):
 *   expo install react-native-gesture-handler react-native-reanimated
 *   npm i react-native-drax
 *
 * Ensure your babel.config.js includes:
 *   plugins: ["react-native-reanimated/plugin"]
 */

export type KanbanCard = {
    id: string;
    title: string;
    description?: string;
    [key: string]: any;
};

export type KanbanColumn = {
    id: string;
    title: string;
    data: KanbanCard[];
};

export type KanbanBoardProps = {
    columns: KanbanColumn[];
    onChange?: (next: KanbanColumn[]) => void;
    /** Render a custom card view */
    renderCard?: (card: KanbanCard, column: KanbanColumn) => React.ReactNode;
    /** Render a custom column header */
    renderColumnHeader?: (column: KanbanColumn) => React.ReactNode;
    /** Height for each card (used by DraxList to compute drag layout) */
    cardHeight?: number;
    /** Column width in px; defaults to 280 */
    columnWidth?: number;
    /** Spacing between columns */
    columnGap?: number;
    /** Called when a card is dropped from one column to another */
    onMoveCard?: (card: KanbanCard, fromId: string, toId: string, position: number) => void;
};

const DEFAULT_CARD_HEIGHT = 80;

export default function KanbanBoard({
    columns: initialColumns,
    onChange,
    renderCard,
    renderColumnHeader,
    cardHeight = DEFAULT_CARD_HEIGHT,
    columnWidth = 280,
    columnGap = 12,
    onMoveCard,
}: KanbanBoardProps) {
    const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);

    // If the parent updates `columns`, mirror it.
    React.useEffect(() => {
        setColumns(initialColumns);
    }, [initialColumns]);

    const setAndEmit = useCallback(
        (next: KanbanColumn[]) => {
            setColumns(next);
            onChange?.(next);
        },
        [onChange]
    );

    const containerStyle = useMemo(
        () => [{ gap: columnGap }, styles.row],
        [columnGap]
    );

    const handleCrossColumnDrop = useCallback(
        (payload: any, targetColumnId: string, targetIndex?: number) => {
            if (!payload || !payload.cardId || !payload.fromColumnId) return;
            const { cardId, fromColumnId } = payload as { cardId: string; fromColumnId: string };

            if (fromColumnId === targetColumnId) return; // no-op if same column

            setAndEmit(
                ((): KanbanColumn[] => {
                    const next = columns.map(c => ({ ...c, data: [...c.data] }));
                    const fromCol = next.find(c => c.id === fromColumnId);
                    const toCol = next.find(c => c.id === targetColumnId);
                    if (!fromCol || !toCol) return next;

                    const idx = fromCol.data.findIndex(i => i.id === cardId);
                    if (idx === -1) return next;

                    const [moved] = fromCol.data.splice(idx, 1);
                    const insertAt = typeof targetIndex === "number" ? Math.max(0, Math.min(targetIndex, toCol.data.length)) : toCol.data.length;
                    toCol.data.splice(insertAt, 0, moved);

                    onMoveCard?.(moved, fromColumnId, targetColumnId, insertAt);
                    return next;
                })()
            );
        },
        [columns, onMoveCard, setAndEmit]
    );

    const renderDefaultCard = useCallback((card: KanbanCard) => (
        <View style={[styles.card, { height: cardHeight }]}>
            <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
            {!!card.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{card.description}</Text>
            )}
        </View>
    ), [cardHeight]);

    const Column = useCallback(({ column }: { column: KanbanColumn }) => {
        // DraxList handles reorder within a column
        const onItemReorder = ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) => {
            if (fromIndex === toIndex) return;
            const next = columns.map(c => ({ ...c, data: [...c.data] }));
            const col = next.find(c => c.id === column.id)!;
            const [moved] = col.data.splice(fromIndex, 1);
            col.data.splice(toIndex, 0, moved);
            setAndEmit(next);
        };

        return (
            <View style={[styles.column, { width: columnWidth }]}>
                <View style={styles.columnHeader}>
                    {renderColumnHeader ? (
                        renderColumnHeader(column)
                    ) : (
                        <Text style={styles.columnTitle}>{column.title}</Text>
                    )}
                </View>

                {/* Drop target for adding to end of column */}
                <DraxView
                    style={styles.dropZone}
                    receptive
                    onReceiveDragDrop={({ dragged: { payload } }) => handleCrossColumnDrop(payload, column.id)}
                    renderContent={() => (
                        <DraxList
                            data={column.data}
                            renderItemContent={({ item, index }) => (
                                <DraxView
                                    key={item.id}
                                    draggable
                                    dragPayload={{ cardId: item.id, fromColumnId: column.id, fromIndex: index }}
                                    draggingStyle={styles.dragging}
                                    dragReleasedStyle={styles.dragReleased}
                                    hoverDraggingStyle={styles.hoverDragging}
                                    snapbackTarget={DraxSnapbackTargetPreset.None}
                                >
                                    {renderCard ? renderCard(item, column) : renderDefaultCard(item)}
                                </DraxView>
                            )}
                            onItemReorder={({ fromIndex, toIndex }) => onItemReorder({ fromIndex, toIndex })}
                            keyExtractor={(item) => item.id}
                            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                            contentContainerStyle={{ padding: 8 }}
                            itemHeight={cardHeight}
                        />
                    )}
                />

                {/* Small add button for demo purposes */}
                <Pressable
                    onPress={() => {
                        const next = columns.map(c => ({ ...c, data: [...c.data] }));
                        const col = next.find(c => c.id === column.id)!;
                        const newCard: KanbanCard = { id: `c_${Date.now()}`, title: "New Card" };
                        col.data.push(newCard);
                        setAndEmit(next);
                    }}
                    style={styles.addBtn}
                >
                    <Text style={styles.addBtnText}>+ Add</Text>
                </Pressable>
            </View>
        );
    }, [cardHeight, columnWidth, columns, handleCrossColumnDrop, renderCard, renderColumnHeader, setAndEmit, renderDefaultCard]);

    return (
        <DraxProvider>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[containerStyle, { paddingHorizontal: 12 }]}
            >
                {columns.map((col) => (
                    <Column key={col.id} column={col} />
                ))}
            </ScrollView>
        </DraxProvider>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    column: {
        backgroundColor: "#F6F7F9",
        borderRadius: 16,
        paddingBottom: 8,
    },
    columnHeader: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E4E6EA",
    },
    columnTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    dropZone: {
        flex: 1,
        minHeight: 120,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 12,
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: "#60646C",
    },
    dragging: {
        opacity: 0.7,
        transform: [{ scale: 1.03 }],
    },
    dragReleased: {
        opacity: 1,
    },
    hoverDragging: {
        borderWidth: 1,
        borderColor: "#C9D4FF",
    },
    addBtn: {
        alignSelf: "center",
        marginTop: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#E9EEF9",
    },
    addBtnText: {
        fontWeight: "600",
    },
});

/**
 * Example usage
 *
 * <KanbanBoard
 *   columns={[
 *     { id: 'todo', title: 'To Do', data: [ { id: '1', title: 'Setup repo' } ] },
 *     { id: 'doing', title: 'In Progress', data: [ { id: '2', title: 'Auth flow' } ] },
 *     { id: 'done', title: 'Done', data: [ { id: '3', title: 'Wireframes' } ] },
 *   ]}
 *   onChange={(next) => console.log(next)}
 * />
 */
