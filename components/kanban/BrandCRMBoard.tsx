import BrandDetailsBottomSheet from "@/components/crm/BrandDetailsBottomSheet";
import { CRMStatus } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { CRMColumnId, moveCardBetweenColumns } from "@/shared-libs/kanban";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { BrandUsageMap, IBrandUsageSummary } from "@/types/BrandUsage";
import {
    compactNumber,
    platformIcon,
    platformLabel,
    tokenPercentUsed,
} from "@/utils/brand-usage";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
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
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@react-navigation/native";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export type KanbanCardT = {
    id: string;
    crmStatus: CRMColumnId;
    name: string;
    image?: string;
    creationTime?: number;
    profile?: {
        about?: string;
        website?: string;
        phone?: string;
    };
};

export type KanbanColumnT = {
    id: CRMColumnId;
    title: string;
    cards: KanbanCardT[];
};

const COLUMN_DEFS: { id: CRMColumnId; title: string }[] = [
    { id: "new_leads", title: "New Leads" },
    { id: "in_progress_leads", title: "In Progress Leads" },
    { id: "active_leads", title: "Active Leads" },
    { id: "churned_leads", title: "Churned Leads" },
];

const emptyColumns = (): KanbanColumnT[] =>
    COLUMN_DEFS.map((col) => ({ ...col, cards: [] }));

export default function BrandCRMBoard() {
    const [columns, setColumns] = useState<KanbanColumnT[]>(emptyColumns);
    const [activeCard, setActiveCard] = useState<KanbanCardT | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [usage, setUsage] = useState<BrandUsageMap>({});
    const [usageError, setUsageError] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<KanbanCardT | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    useEffect(() => {
        const fetchBrands = async () => {
            setError(null);
            setLoading(true);
            try {
                const brandsRef = collection(FirestoreDB, "brands");
                const snap = await getDocs(
                    query(brandsRef, orderBy("creationTime", "desc"))
                );

                const grouped: Record<CRMColumnId, KanbanCardT[]> = {
                    new_leads: [],
                    in_progress_leads: [],
                    active_leads: [],
                    churned_leads: [],
                };

                snap.docs.forEach((docSnap) => {
                    const data = docSnap.data() as any;
                    const card: KanbanCardT = {
                        id: docSnap.id,
                        crmStatus: (data.crmStatus ||
                            CRMStatus.NEW_LEADS) as CRMColumnId,
                        name: data.name || "Unknown Brand",
                        image: data.image,
                        creationTime: data.creationTime,
                        profile: data.profile,
                    };
                    (grouped[card.crmStatus] ?? grouped.new_leads).push(card);
                });

                setColumns(
                    COLUMN_DEFS.map((col) => ({
                        ...col,
                        cards: grouped[col.id],
                    }))
                );
            } catch (err: any) {
                Console.error(err, "Failed to fetch brands");
                setError(err?.message || "Unable to load brands");
            } finally {
                setLoading(false);
            }
        };
        fetchBrands();
    }, []);

    // Usage metrics come from the admin API rather than Firestore: content,
    // strategies and AI conversations are not readable client-side, and the
    // token wallet lives on the organization.
    useEffect(() => {
        const fetchUsage = async () => {
            setUsageError(null);
            try {
                const res = await HttpWrapper.fetch("/api/v2/admin/brands/usage", {
                    method: "GET",
                });
                const body = await res.json();
                setUsage(body?.brands ?? {});
            } catch (err: any) {
                Console.error(err, "Failed to fetch brand usage");
                const message = await HttpWrapper.extractErrorMessage(err);
                setUsageError(message || "Unable to load usage metrics");
            }
        };
        fetchUsage();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleOpenBottomSheet = useCallback((brand: KanbanCardT) => {
        setSelectedBrand(brand);
        setIsModalVisible(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
        setSelectedBrand(null);
    }, []);

    const handleDragStart = (event: any) => {
        const [, cardId] = event.active.id.split(":");
        setActiveCard(
            columns.flatMap((c) => c.cards).find((c) => c.id === cardId) || null
        );
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);
        if (!over) return;

        const previousColumns = columns;
        const [fromColumnId, fromCardId] = (active.id as string).split(":");
        const overId = over.id as string;

        const isDroppingOnColumn = columns.some((c) => c.id === overId);
        const toColumnId = (
            isDroppingOnColumn ? overId : overId.split(":")[0]
        ) as CRMColumnId;
        const toCardId = isDroppingOnColumn ? null : overId.split(":")[1];

        let insertIndex: number | undefined = undefined;
        if (toCardId) {
            insertIndex = columns
                .find((c) => c.id === toColumnId)
                ?.cards.findIndex((c) => c.id === toCardId);
        }

        setColumns((prev) =>
            moveCardBetweenColumns(
                prev,
                fromCardId,
                fromColumnId as CRMColumnId,
                toColumnId,
                insertIndex
            )
        );

        try {
            await updateDoc(doc(FirestoreDB, "brands", fromCardId), {
                crmStatus: toColumnId,
            });
        } catch (err) {
            Console.error(err, "Failed to persist crmStatus, rolling back");
            setColumns(previousColumns);
        }
    };

    return (
        <View style={styles.root}>
            <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
                {loading && (
                    <View style={styles.statusRow}>
                        <ActivityIndicator color={colors.primary} size="small" />
                        <Text style={styles.statusText}>Loading brands…</Text>
                    </View>
                )}
                {error && <Text style={styles.errorText}>{error}</Text>}
                {usageError && (
                    <Text style={styles.warningText}>
                        {usageError} — cards will show brand details without metrics.
                    </Text>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <DragOverlay>
                        {activeCard ? (
                            <View style={styles.dragOverlay}>
                                <Text style={styles.brandName}>{activeCard.name}</Text>
                            </View>
                        ) : null}
                    </DragOverlay>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.boardContent}
                    >
                        <View style={styles.row}>
                            {columns.map((col) => (
                                <DroppableColumn
                                    key={col.id}
                                    column={col}
                                    usage={usage}
                                    onCardPress={handleOpenBottomSheet}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </DndContext>
            </ScrollView>

            <BrandDetailsBottomSheet
                visible={isModalVisible}
                brand={selectedBrand}
                onClose={handleCloseModal}
            />
        </View>
    );
}

const DroppableColumn = ({
    column,
    usage,
    onCardPress,
}: {
    column: KanbanColumnT;
    usage: BrandUsageMap;
    onCardPress: (card: KanbanCardT) => void;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
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
                <Text style={styles.columnTitle} numberOfLines={1}>
                    {column.title}
                </Text>
                <View style={styles.countPill}>
                    <Text style={styles.countPillText}>{column.cards.length}</Text>
                </View>
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
                        <SortableCard
                            key={card.id}
                            id={`${column.id}:${card.id}`}
                            card={card}
                            usage={usage[card.id]}
                            onPress={onCardPress}
                        />
                    ))}
                </SortableContext>

                {column.cards.length === 0 && (
                    <Text style={styles.dropHint}>Drop here to move card</Text>
                )}
            </ScrollView>
        </View>
    );
};

const Metric = ({
    icon,
    value,
    label,
}: {
    icon: string;
    value: string;
    label: string;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <View style={styles.metric}>
            <Icon name={icon as any} size={15} color={colors.primary} />
            <View style={styles.metricText}>
                <Text style={styles.metricValue} numberOfLines={1}>
                    {value}
                </Text>
                <Text style={styles.metricLabel} numberOfLines={1}>
                    {label}
                </Text>
            </View>
        </View>
    );
};

const SortableCard = ({
    id,
    card,
    usage,
    onPress,
}: {
    id: string;
    card: KanbanCardT;
    usage?: IBrandUsageSummary;
    onPress: (card: KanbanCardT) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isOver } =
        useSortable({ id });
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const dragStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const owner = usage?.owner;
    const tokens = usage?.tokens;
    const percentUsed = tokenPercentUsed(tokens);

    const joinedLabel = (() => {
        if (!card.creationTime) return "";
        const days = Math.ceil(
            Math.abs(Date.now() - card.creationTime) / (1000 * 60 * 60 * 24)
        );
        return `Joined ${days}d ago`;
    })();

    // Filter out web-only a11y attributes that React Native does not accept.
    const { tabIndex, role, ...restAttributes } = attributes as any;

    return (
        // @ts-ignore — dnd-kit's ref/listeners are DOM-typed; this board is web-only.
        <View
            ref={setNodeRef as any}
            {...restAttributes}
            {...listeners}
            style={[styles.card, dragStyle]}
        >
            {isOver && <View style={styles.dropIndicator} />}

            <Pressable onPress={() => onPress(card)}>
                <View style={styles.cardHeader}>
                    <View style={styles.brandImage}>
                        {card.image ? (
                            <Image
                                source={{ uri: card.image }}
                                style={styles.brandImage}
                            />
                        ) : (
                            <Text style={styles.brandInitial}>
                                {card.name?.charAt(0)?.toUpperCase() || "B"}
                            </Text>
                        )}
                    </View>

                    <View style={styles.headerText}>
                        <Text style={styles.brandName} numberOfLines={1}>
                            {card.name}
                        </Text>
                        {owner?.name ? (
                            <Text style={styles.ownerName} numberOfLines={1}>
                                {owner.name}
                            </Text>
                        ) : null}
                        {owner?.email ? (
                            <Text style={styles.ownerEmail} numberOfLines={1}>
                                {owner.email}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.metricsGrid}>
                    <Metric
                        icon="message-text-outline"
                        value={compactNumber(usage?.aiConversations ?? 0)}
                        label="AI chats"
                    />
                    <Metric
                        icon="file-document-outline"
                        value={compactNumber(usage?.contentTotal ?? 0)}
                        label="Content"
                    />
                    <Metric
                        icon="lightning-bolt-outline"
                        value={percentUsed === null ? "—" : `${percentUsed}%`}
                        label="Tokens"
                    />
                    <Metric
                        icon={platformIcon(owner?.lastSeenPlatform)}
                        value={platformLabel(owner?.lastSeenPlatform)}
                        label="Device"
                    />
                </View>

                <View style={styles.cardFooter}>
                    {tokens?.planKey ? (
                        <View style={styles.planPill}>
                            <Text style={styles.planPillText}>
                                {tokens.planKey.toUpperCase()}
                            </Text>
                        </View>
                    ) : (
                        <View />
                    )}
                    <Text style={styles.joinedText}>{joinedLabel}</Text>
                </View>
            </Pressable>
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        page: { flex: 1 },
        pageContent: { padding: 20 },
        boardContent: { paddingBottom: 20, paddingRight: 16 },
        row: {
            flexDirection: "row",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "nowrap",
        },
        statusRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
        },
        statusText: { color: colors.textSecondary, fontSize: 14 },
        errorText: { color: colors.red, marginBottom: 12, fontSize: 14 },
        warningText: { color: colors.textSecondary, marginBottom: 12, fontSize: 13 },

        column: {
            borderRadius: 14,
            padding: 12,
            width: 300,
            minHeight: 500,
            maxHeight: 900,
            flexShrink: 0,
        },
        columnScroll: { flex: 1, paddingBottom: 8 },
        columnHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 10,
            marginBottom: 10,
            gap: 8,
        },
        columnTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            flexShrink: 1,
        },
        countPill: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
        },
        countPillText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
        },
        dropHint: {
            textAlign: "center",
            marginTop: 20,
            color: colors.textSecondary,
            fontSize: 13,
        },

        card: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            position: "relative",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        dragOverlay: {
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.card,
            width: 280,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: 0.18,
            elevation: 12,
        },
        dropIndicator: {
            position: "absolute",
            top: -5,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: colors.primary,
            borderRadius: 2,
        },

        cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
        brandImage: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.tag,
            flexShrink: 0,
        },
        brandInitial: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.textSecondary,
        },
        headerText: { flex: 1, minWidth: 0 },
        brandName: { fontSize: 15, fontWeight: "700", color: colors.text },
        ownerName: { fontSize: 12, color: colors.text, marginTop: 2 },
        ownerEmail: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

        metricsGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            backgroundColor: colors.tag,
            borderRadius: 10,
            padding: 10,
            marginTop: 12,
            rowGap: 10,
        },
        metric: {
            width: "50%",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        metricText: { flexShrink: 1, minWidth: 0 },
        metricValue: { fontSize: 13, fontWeight: "700", color: colors.text },
        metricLabel: { fontSize: 10, color: colors.textSecondary },

        cardFooter: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            gap: 8,
        },
        planPill: {
            backgroundColor: colors.primary,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
        },
        planPillText: {
            fontSize: 10,
            fontWeight: "700",
            color: colors.onPrimary,
            letterSpacing: 0.4,
        },
        joinedText: {
            fontSize: 11,
            color: colors.textSecondary,
            fontStyle: "italic",
        },
    });
