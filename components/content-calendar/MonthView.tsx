import Colors from "@/shared-uis/constants/Colors";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    pointerWithin,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import CalendarHeader from "./CalendarHeader";
import ContentItemChip from "./ContentItemChip";
import { CalendarItem, CalendarView } from "./types";

interface MonthViewProps {
    year: number;
    month: number; // 0-indexed
    items: CalendarItem[];
    view: CalendarView;
    onViewChange: (next: CalendarView) => void;
    onMonthChange: (year: number, month: number) => void;
    onDayPress: (dateStr: string) => void;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
    onOpenItem: (item: CalendarItem) => void;
    /**
     * Persist a content item moving to a new day (web drag-and-drop only).
     * When omitted, drag-and-drop is disabled and cells render as before.
     */
    onMoveItem?: (itemId: string, newDate: string) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// A month cell only has room for ~one compact chip above the day number; any
// extra items collapse into the `+N more` link, which opens the day popover.
const MAX_INLINE_CHIPS = 1;

function buildCalendarGrid(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);

    const rows: (number | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) {
        rows.push(grid.slice(i, i + 7));
    }
    return rows;
}

function toIso(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number) {
    const now = new Date();
    return (
        now.getFullYear() === year &&
        now.getMonth() === month &&
        now.getDate() === day
    );
}

const MonthView: React.FC<MonthViewProps> = ({
    year,
    month,
    items,
    view,
    onViewChange,
    onMonthChange,
    onDayPress,
    onFocusChat,
    onComment,
    onOpenItem,
    onMoveItem,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const rows = useMemo(() => buildCalendarGrid(year, month), [year, month]);

    const itemsByDate = useMemo(() => {
        const map: Record<string, CalendarItem[]> = {};
        items.forEach((item) => {
            if (!map[item.date]) map[item.date] = [];
            map[item.date].push(item);
        });
        return map;
    }, [items]);

    // `+N more` opens a floating card anchored to the day cell, listing every
    // item for that date. `anchor` is the cell's window-space rect (measured on
    // press) so the card can position itself next to it and clamp to the screen.
    const [popover, setPopover] = useState<{
        dateStr: string;
        anchor: { x: number; y: number; width: number; height: number };
    } | null>(null);

    // Drag-and-drop is web-only (@dnd-kit relies on the DOM). On native the
    // grid renders exactly as before. `onMoveItem` gates persistence/perms.
    const dndEnabled = Platform.OS === "web" && !!onMoveItem;
    const [activeItem, setActiveItem] = useState<CalendarItem | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string;
        setActiveItem(items.find((i) => i.id === id) ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        if (!over) return;
        const itemId = active.id as string;
        const newDate = over.id as string; // droppables are keyed by ISO date
        const item = items.find((i) => i.id === itemId);
        if (!item || item.date === newDate) return;
        onMoveItem?.(itemId, newDate);
    };

    const renderChip = (item: CalendarItem) =>
        dndEnabled ? (
            <DraggableChip
                key={item.id}
                item={item}
                onFocusChat={onFocusChat}
                onComment={onComment}
                onOpen={onOpenItem}
            />
        ) : (
            <ContentItemChip
                key={item.id}
                item={item}
                compact
                onFocusChat={onFocusChat}
                onComment={onComment}
                onOpen={onOpenItem}
            />
        );

    const renderCellInner = (day: number, dateStr: string, today: boolean) => {
        const dayItems = itemsByDate[dateStr] ?? [];
        return (
            <>
                <Text style={[styles.dayNumber, today && styles.dayNumberToday]}>
                    {day}
                </Text>
                {dayItems.slice(0, MAX_INLINE_CHIPS).map(renderChip)}
                {dayItems.length > MAX_INLINE_CHIPS && (
                    <MoreLink
                        count={dayItems.length - MAX_INLINE_CHIPS}
                        onOpen={(anchor) => setPopover({ dateStr, anchor })}
                    />
                )}
            </>
        );
    };

    const grid = (
        <View style={styles.gridContent}>
            {rows.map((row, ri) => (
                <View key={ri} style={styles.weekRow}>
                    {row.map((day, di) => {
                        if (day === null) {
                            return <View key={di} style={styles.dayCell} />;
                        }
                        const dateStr = toIso(year, month, day);
                        const today = isToday(year, month, day);

                        if (dndEnabled) {
                            return (
                                <DroppableDayCell
                                    key={di}
                                    dateStr={dateStr}
                                    today={today}
                                    onPress={() => onDayPress(dateStr)}
                                >
                                    {renderCellInner(day, dateStr, today)}
                                </DroppableDayCell>
                            );
                        }

                        return (
                            <Pressable
                                key={di}
                                style={({ pressed }) => [
                                    styles.dayCell,
                                    styles.dayCellActive,
                                    today && styles.dayCellToday,
                                    pressed && styles.dayCellPressed,
                                ]}
                                onPress={() => onDayPress(dateStr)}
                            >
                                {renderCellInner(day, dateStr, today)}
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <CalendarHeader
                year={year}
                month={month}
                view={view}
                onMonthChange={onMonthChange}
                onViewChange={onViewChange}
            />

            <View style={styles.dayLabelsRow}>
                {DAY_LABELS.map((d) => (
                    <Text key={d} style={styles.dayLabelText}>
                        {d}
                    </Text>
                ))}
            </View>

            {dndEnabled ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {grid}
                    <DragOverlay>
                        {activeItem ? (
                            <View style={styles.dragOverlay}>
                                <ContentItemChip
                                    item={activeItem}
                                    compact
                                    onFocusChat={onFocusChat}
                                    onComment={onComment}
                                />
                            </View>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            ) : (
                grid
            )}

            {popover && (
                <DayPopover
                    dateStr={popover.dateStr}
                    anchor={popover.anchor}
                    items={itemsByDate[popover.dateStr] ?? []}
                    onClose={() => setPopover(null)}
                    onFocusChat={onFocusChat}
                    onComment={onComment}
                    onOpenItem={(item) => {
                        setPopover(null);
                        onOpenItem(item);
                    }}
                />
            )}
        </View>
    );
};

/**
 * The `+N more` affordance on a busy day. Measures its own window-space rect on
 * press so the parent can anchor the day popover next to it. Nested inside the
 * day cell's Pressable, so its own press is consumed and never reaches the
 * cell's "Add Content" handler.
 */
const MoreLink: React.FC<{
    count: number;
    onOpen: (rect: { x: number; y: number; width: number; height: number }) => void;
}> = ({ count, onOpen }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const ref = useRef<View>(null);

    const handlePress = () => {
        const node = ref.current as any;
        if (node?.measureInWindow) {
            node.measureInWindow(
                (x: number, y: number, width: number, height: number) =>
                    onOpen({ x, y, width, height })
            );
        } else {
            onOpen({ x: 0, y: 0, width: 0, height: 0 });
        }
    };

    return (
        <Pressable
            ref={ref}
            onPress={handlePress}
            hitSlop={6}
            style={({ pressed }) => [
                styles.moreLink,
                pressed && styles.moreLinkPressed,
            ]}
        >
            <Text style={styles.moreText}>+{count} more</Text>
        </Pressable>
    );
};

/** Human label for a YYYY-MM-DD string, e.g. "Mon, 1 Jun". */
function formatDayLabel(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

const POPOVER_WIDTH = 268;

/**
 * Floating card anchored to a day cell, listing every content item on that day.
 * Rendered in a transparent Modal so it floats above the grid (and the right
 * panel) and a full-screen backdrop closes it on an outside tap. Position is
 * clamped to the viewport so edge days don't spill off-screen.
 */
const DayPopover: React.FC<{
    dateStr: string;
    anchor: { x: number; y: number; width: number; height: number };
    items: CalendarItem[];
    onClose: () => void;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
    onOpenItem: (item: CalendarItem) => void;
}> = ({ dateStr, anchor, items, onClose, onFocusChat, onComment, onOpenItem }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const { width: winW, height: winH } = useWindowDimensions();

    const maxHeight = Math.min(360, winH * 0.6);

    // Horizontal: align the card's left edge with the cell, then clamp.
    let left = anchor.x;
    if (left + POPOVER_WIDTH > winW - 8) left = winW - 8 - POPOVER_WIDTH;
    if (left < 8) left = 8;

    // Vertical: open just below the cell top; if it would overflow the bottom,
    // pull it up so it stays fully on screen.
    let top = anchor.y;
    if (top + maxHeight > winH - 8) top = Math.max(8, winH - 8 - maxHeight);

    return (
        <Modal transparent visible animationType="fade" onRequestClose={onClose}>
            <View style={styles.popoverRoot}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View
                    style={[
                        styles.popoverCard,
                        { left, top, width: POPOVER_WIDTH, maxHeight },
                    ]}
                >
                    <View style={styles.popoverHeader}>
                        <Text style={styles.popoverTitle}>
                            {formatDayLabel(dateStr)}
                        </Text>
                        <View style={styles.popoverCountBadge}>
                            <Text style={styles.popoverCountText}>
                                {items.length}
                            </Text>
                        </View>
                    </View>
                    <ScrollView
                        style={styles.popoverScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        {items.map((item) => (
                            <ContentItemChip
                                key={item.id}
                                item={item}
                                onFocusChat={onFocusChat}
                                onComment={onComment}
                                onOpen={onOpenItem}
                            />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

/**
 * A day cell that accepts dropped content chips. Keyed by its ISO date so the
 * drag-end handler can read the destination date straight off `over.id`.
 */
const DroppableDayCell: React.FC<{
    dateStr: string;
    today: boolean;
    onPress: () => void;
    children: React.ReactNode;
}> = ({ dateStr, today, onPress, children }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const { setNodeRef, isOver } = useDroppable({ id: dateStr });

    return (
        <Pressable
            ref={setNodeRef as any}
            style={({ pressed }) => [
                styles.dayCell,
                styles.dayCellActive,
                today && styles.dayCellToday,
                isOver && styles.dayCellDropOver,
                pressed && styles.dayCellPressed,
            ]}
            onPress={onPress}
        >
            {children}
        </Pressable>
    );
};

/**
 * Wraps a ContentItemChip with drag handles. The inner chip's Pressables still
 * fire on click — the PointerSensor's 8px activation distance separates a tap
 * from a drag.
 */
const DraggableChip: React.FC<{
    item: CalendarItem;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
    onOpen: (item: CalendarItem) => void;
}> = ({ item, onFocusChat, onComment, onOpen }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: item.id });
    const { tabIndex, role, ...restAttributes } = attributes as any;

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? "grabbing" : "grab",
    };

    return (
        <View
            ref={setNodeRef as any}
            {...restAttributes}
            {...listeners}
            style={style as any}
        >
            <ContentItemChip
                item={item}
                compact
                onFocusChat={onFocusChat}
                onComment={onComment}
                onOpen={onOpen}
            />
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                },
                dayLabelsRow: {
                    flexDirection: "row",
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                },
                dayLabelText: {
                    flex: 1,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                gridContent: {
                    flex: 1,
                    paddingHorizontal: 8,
                    paddingBottom: 8,
                    gap: 4,
                },
                weekRow: {
                    flex: 1,
                    flexDirection: "row",
                    gap: 4,
                    minHeight: 80,
                },
                dayCell: {
                    flex: 1,
                    borderRadius: 10,
                    padding: 6,
                    overflow: "hidden",
                },
                dayCellActive: {
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                dayCellToday: {
                    backgroundColor: colors.aliceBlue,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.15,
                    elevation: 2,
                },
                dayCellPressed: {
                    opacity: 0.75,
                },
                dayCellDropOver: {
                    backgroundColor: colors.primaryLight,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.25,
                    elevation: 3,
                },
                dragOverlay: {
                    width: 180,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 0.18,
                    elevation: 8,
                },
                dayNumber: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 4,
                },
                dayNumberToday: {
                    color: colors.primary,
                },
                moreLink: {
                    alignSelf: "flex-start",
                    paddingVertical: 2,
                    paddingHorizontal: 2,
                    borderRadius: 4,
                    marginTop: 2,
                },
                moreLinkPressed: {
                    opacity: 0.6,
                },
                moreText: {
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.primary,
                },
                popoverRoot: {
                    flex: 1,
                },
                popoverCard: {
                    position: "absolute",
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    paddingTop: 10,
                    paddingHorizontal: 10,
                    paddingBottom: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 0.18,
                    elevation: 8,
                },
                popoverHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    paddingHorizontal: 2,
                },
                popoverTitle: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                },
                popoverCountBadge: {
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                    paddingHorizontal: 6,
                    backgroundColor: colors.tag,
                    alignItems: "center",
                    justifyContent: "center",
                },
                popoverCountText: {
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.textSecondary,
                },
                popoverScroll: {
                    flexShrink: 1,
                },
            }),
        [colors]
    );
}

export default MonthView;
