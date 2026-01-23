import BrandDetailsBottomSheet from "@/components/crm/BrandDetailsBottomSheet";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { CRMStatus } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    PointerSensor,
    closestCorners,
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
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type KanbanCardT = {
    id: string;
    crmStatus: string;
    name: string;
    image?: string;
    creationTime?: number;
    discoveredInfluencers?: string[];
    collaborationCount?: number;
    profile?: {
        about?: string;
        industries?: string[];
        website?: string;
        phone?: string;
    };
    billing?: {
        planKey?: string;
    };
};

export type KanbanColumnT = {
    id: string;
    title: string;
    cards: KanbanCardT[];
};

export default function BrandCRMBoard() {
    const [columns, setColumns] = useState<KanbanColumnT[]>([
        { id: "new_leads", title: "New Leads", cards: [] },
        { id: "in_progress_leads", title: "In Progress Leads", cards: [] },
        { id: "active_leads", title: "Active Leads", cards: [] },
        { id: "churned_leads", title: "Churned Leads", cards: [] },
    ]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<KanbanCardT | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [discoveredInfluencers, setDiscoveredInfluencers] = useState<any[]>([]);
    const [loadingInfluencers, setLoadingInfluencers] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
    const { manager } = useAuthContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    useEffect(() => {
        const fetchBrands = async () => {
            setError(null);
            setLoading(true);
            try {
                console.log("[Kanban] Fetching brands from brands collection");

                const brandsRef = collection(FirestoreDB, "brands");
                const brandsQuery = query(brandsRef);

                const snap = await getDocs(brandsQuery);
                console.log("[Kanban] Brands found", snap.size);

                if (snap.empty) {
                    console.log("[Kanban] No brands with crmStatus found");
                    setColumns([
                        { id: "new_leads", title: `New Leads (0)`, cards: [] },
                        { id: "in_progress_leads", title: `In Progress Leads (0)`, cards: [] },
                        { id: "active_leads", title: `Active Leads (0)`, cards: [] },
                        { id: "churned_leads", title: `Churned Leads (0)`, cards: [] },
                    ]);
                    return;
                }

                const brands: KanbanCardT[] = [];

                // Fetch collaboration counts for each brand
                const collaborationsRef = collection(FirestoreDB, "collaborations");

                for (const docSnap of snap.docs) {
                    const data = docSnap.data() as any;
                    console.log("[Kanban] Brand doc", docSnap.id, data);

                    // Get collaboration count for this brand
                    let collaborationCount = 0;
                    try {
                        const collabQuery = query(collaborationsRef, where("brandId", "==", docSnap.id));
                        const collabSnap = await getDocs(collabQuery);
                        collaborationCount = collabSnap.size;
                    } catch (err) {
                        console.warn("[Kanban] Failed to fetch collaborations for brand", docSnap.id, err);
                    }

                    brands.push({
                        id: docSnap.id,
                        crmStatus: data.crmStatus || CRMStatus.NEW_LEADS,
                        name: data.name || "Unknown Brand",
                        image: data.image,
                        creationTime: data.creationTime,
                        discoveredInfluencers: data.discoveredInfluencers,
                        collaborationCount,
                        profile: data.profile,
                        billing: data.billing,
                    });
                }
                console.log("[Kanban] Total brands", brands.length);

                const grouped: Record<string, KanbanCardT[]> = {
                    new_leads: [],
                    in_progress_leads: [],
                    active_leads: [],
                    churned_leads: [],
                };
                brands.forEach((brand) => {
                    const bucket = (brand.crmStatus || CRMStatus.NEW_LEADS).toLowerCase();
                    if (bucket === CRMStatus.IN_PROGRESS_LEADS) grouped.in_progress_leads.push(brand);
                    else if (bucket === CRMStatus.ACTIVE_LEADS) grouped.active_leads.push(brand);
                    else if (bucket === CRMStatus.CHURNED_LEADS) grouped.churned_leads.push(brand);
                    else grouped.new_leads.push(brand);
                });
                console.log("[Kanban] Grouped counts", {
                    new_leads: grouped.new_leads.length,
                    in_progress_leads: grouped.in_progress_leads.length,
                    active_leads: grouped.active_leads.length,
                    churned_leads: grouped.churned_leads.length,
                });
                setColumns([
                    {
                        id: "new_leads",
                        title: `New Leads (${grouped.new_leads.length})`,
                        cards: grouped.new_leads,
                    },
                    {
                        id: "in_progress_leads",
                        title: `In Progress Leads (${grouped.in_progress_leads.length})`,
                        cards: grouped.in_progress_leads,
                    },
                    {
                        id: "active_leads",
                        title: `Active Leads (${grouped.active_leads.length})`,
                        cards: grouped.active_leads,
                    },
                    {
                        id: "churned_leads",
                        title: `Churned Leads (${grouped.churned_leads.length})`,
                        cards: grouped.churned_leads,
                    },
                ]);
            } catch (err: any) {
                console.warn("Failed to fetch brands", err);
                setError(err?.message || "Unable to load brands");
            } finally {
                setLoading(false);
            }
        };
        fetchBrands();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleOpenBottomSheet = useCallback((brand: KanbanCardT) => {
        console.log("[BrandCRMBoard] Opening modal for brand:", brand.name, brand.id);
        setSelectedBrand(brand);
        setIsModalVisible(true);

        // Fetch discovered influencers and campaigns
        fetchDiscoveredInfluencers(brand.discoveredInfluencers);
        fetchCampaigns(brand.id);
        fetchMembers(brand.id);
        fetchSubscription(brand.id);
    }, []);

    const fetchDiscoveredInfluencers = async (influencerIds?: string[]) => {
        if (!influencerIds || influencerIds.length === 0) {
            setDiscoveredInfluencers([]);
            return;
        }

        setLoadingInfluencers(true);
        try {
            const influencers: any[] = [];

            // Fetch each influencer from scrapped-socials collection
            for (const influencerId of influencerIds) {
                try {
                    const docRef = doc(FirestoreDB, "scrapped-socials", influencerId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        influencers.push({
                            id: influencerId,
                            ...docSnap.data()
                        });
                    }
                } catch (err) {
                    console.warn(`Failed to fetch influencer ${influencerId}`, err);
                }
            }

            console.log("[BrandCRMBoard] Fetched discovered influencers:", influencers.length);
            setDiscoveredInfluencers(influencers);
        } catch (err: any) {
            console.warn("Failed to fetch discovered influencers", err);
        } finally {
            setLoadingInfluencers(false);
        }
    };

    const fetchCampaigns = async (brandId?: string) => {
        if (!brandId) {
            setCampaigns([]);
            return;
        }

        setLoadingCampaigns(true);
        try {
            const collaborationCol = collection(FirestoreDB, "collaborations");
            const q = query(
                collaborationCol,
                where("brandId", "==", brandId)
            );

            const snap = await getDocs(q);
            const campaignsList: any[] = [];

            for (const docSnap of snap.docs) {
                const data = docSnap.data();

                // Filter to only active collaborations
                const statusValue = (data?.status || "").toString().toLowerCase();
                const isActive = data?.isActive === true || statusValue === "active";
                if (!isActive) continue;

                // Fetch applications count
                const applicationCol = collection(
                    FirestoreDB,
                    "collaborations",
                    docSnap.id,
                    "applications"
                );
                const applicationSnapshot = await getDocs(applicationCol);
                const applications = applicationSnapshot.docs.map((appDoc) =>
                    appDoc.data()
                );
                const acceptedApplications = applications.filter(
                    (application) => application.status === "accepted"
                ).length;

                // Fetch invitations count
                const invitationCol = collection(
                    FirestoreDB,
                    "collaborations",
                    docSnap.id,
                    "invitations"
                );
                const invitationSnapshot = await getDocs(invitationCol);
                const invitations = invitationSnapshot.docs.map((invDoc) =>
                    invDoc.data()
                );

                campaignsList.push({
                    id: docSnap.id,
                    ...data,
                    applications: applications.length,
                    invitations: invitations.length,
                    acceptedApplications,
                });
            }

            console.log("[BrandCRMBoard] Fetched campaigns:", campaignsList.length);
            setCampaigns(campaignsList);
        } catch (err: any) {
            console.warn("Failed to fetch campaigns", err);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const fetchMembers = async (brandId?: string) => {
        if (!brandId) {
            setMembers([]);
            return;
        }
        try {
            const managersRef = collection(FirestoreDB, "managers");
            const q = query(managersRef, where("brandId", "==", brandId));
            const querySnapshot = await getDocs(q);

            const managersList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            console.log("[BrandCRMBoard] Fetched managers:", managersList);
            setMembers(managersList);
        } catch (err) {
            console.warn("Failed to fetch members", err);
            setMembers([]);
        }
    };

    const fetchSubscription = async (brandId?: string) => {
        if (!brandId) {
            setSubscriptionDetails(null);
            return;
        }
        try {
            const brandDoc = await getDoc(doc(FirestoreDB, "brands", brandId));
            if (brandDoc.exists()) {
                const brandData = brandDoc.data();
                console.log("[BrandCRMBoard] Billing data:", brandData?.billing);
                console.log("[BrandCRMBoard] Subscription field:", brandData?.subscription);
                const subscription = brandData?.billing?.subscription || brandData?.subscription || brandData?.billing;
                console.log("[BrandCRMBoard] Setting subscription:", subscription);
                setSubscriptionDetails(subscription);
            } else {
                console.warn("[BrandCRMBoard] Brand document does not exist:", brandId);
                setSubscriptionDetails(null);
            }
        } catch (err) {
            console.warn("Failed to fetch subscription", err);
            setSubscriptionDetails(null);
        }
    };

    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
        setSelectedBrand(null);
    }, []);

    const formatBudget = (budget: any): string => {
        // Normalize possible budget shapes: [min, max], {min,max}, single number/string
        const extractPair = (src: any): [any, any] => {
            if (Array.isArray(src)) return [src[0], src[1]];
            if (src && typeof src === "object") {
                const min = src.min ?? src.from ?? src.start ?? src.low ?? src.amount ?? src.value ?? src[0];
                const max = src.max ?? src.to ?? src.end ?? src.high ?? src.ceiling ?? src[1];
                return [min, max];
            }
            return [undefined, undefined];
        };

        const formatValue = (val: any) => {
            if (val === 0) return "0";
            if (val === undefined || val === null || val === "") return "";
            return `${val}`;
        };

        // Single scalar budget
        if (typeof budget === "number" || typeof budget === "string") {
            const val = formatValue(budget);
            return val ? `Rs. ${val}` : "—";
        }

        const [minRaw, maxRaw] = extractPair(budget);
        const min = formatValue(minRaw);
        const max = formatValue(maxRaw);
        if (min || max) {
            const minText = min ? `Rs. ${min}` : "";
            const maxText = max ? ` - Rs. ${max}` : "";
            const combined = `${minText}${maxText}`.trim();
            return combined.length ? combined : "—";
        }

        return "—";
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const [activeColumnId] = activeId.split(":");
        const [overColumnId] = overId.split(":");

        if (activeColumnId === overColumnId) return;

        setColumns((columns) => {
            const activeColumn = columns.find((col) => col.id === activeColumnId);
            const overColumn = columns.find((col) => col.id === overColumnId);

            if (!activeColumn || !overColumn) return columns;

            const activeCard = activeColumn.cards.find((c) => activeId.includes(c.id));
            if (!activeCard) return columns;

            const newColumns = columns.map((col) => {
                if (col.id === activeColumnId) {
                    return {
                        ...col,
                        cards: col.cards.filter((c) => !activeId.includes(c.id)),
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

        const activeId = active.id as string;
        const overId = over.id as string;

        const [fromColumnId, fromCardId] = activeId.split(":");

        // Check if dropping on a column directly
        const toColumn = columns.find((c) => c.id === overId);
        const toColumnId = toColumn ? overId : overId.split(":")[0];
        const toCardId = toColumn ? null : overId.split(":")[1];

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
                // Update crmStatus in brands collection
                const brandRef = doc(FirestoreDB, "brands", card.id);
                await updateDoc(brandRef, { crmStatus: to.id });
            } catch (err) {
                console.warn("Failed to update brand crmStatus", err);
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Brands CRM</Text>
            </View>

            {loading && (
                <Text style={{ paddingVertical: 8, opacity: 0.7 }}>
                    Loading Brands…
                </Text>
            )}
            {error && (
                <Text style={{ color: colors.red, marginBottom: 8 }}>{error}</Text>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20, paddingRight: 16 }}
                >
                    <View style={styles.row}>
                        {columns.map((col) => (
                            <DroppableColumn key={col.id} column={col} onCardPress={handleOpenBottomSheet} />
                        ))}
                    </View>
                </ScrollView>
            </DndContext>

            <BrandDetailsBottomSheet
                visible={isModalVisible}
                brand={selectedBrand}
                onClose={handleCloseModal}
                discoveredInfluencers={discoveredInfluencers}
                loadingInfluencers={loadingInfluencers}
                campaigns={campaigns}
                loadingCampaigns={loadingCampaigns}
                members={members}
                subscriptionDetails={subscriptionDetails}
                formatBudget={formatBudget}
            />
        </View>
    );
}

const DroppableColumn = ({ column, onCardPress }: { column: KanbanColumnT; onCardPress: (card: KanbanCardT) => void }) => {
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
                        <SortableCard
                            key={card.id}
                            id={`${column.id}:${card.id}`}
                            card={card}
                            colId={column.id}
                            onPress={onCardPress}
                        />
                    ))}
                </SortableContext>

                {column.cards.length === 0 && (
                    <Text style={{ textAlign: "center", opacity: 0.6, marginTop: 20 }}>
                        Drop here to move card
                    </Text>
                )}
            </ScrollView>
        </View>
    );
};

const SortableCard = ({
    id,
    card,
    colId,
    onPress,
}: {
    id: string;
    card: KanbanCardT;
    colId: string;
    onPress: (card: KanbanCardT) => void;
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

    const handlePress = () => {
        console.log("[BrandCRMBoard] Card pressed:", card.name, card.id);
        onPress(card);
    };

    // Filter out web-specific attributes
    const { tabIndex, role, ...restAttributes } = attributes as any;

    return (
        // @ts-ignore
        <View
            ref={setNodeRef as any}
            {...restAttributes}
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
            <Pressable onPress={handlePress} style={{ flex: 1 }}>
                {/* Row 1: Image and Name */}
                <View style={styles.cardRow}>
                    <View
                        style={[
                            styles.brandImage,
                            { backgroundColor: "#F3F4F6" },
                        ]}
                    >
                        {card.image ? (
                            <Image
                                source={{ uri: card.image }}
                                style={styles.brandImage}
                            />
                        ) : (
                            <Text style={{ fontSize: 24, fontWeight: "700", color: "#6B7280" }}>
                                {card.name?.charAt(0)?.toUpperCase() || "B"}
                            </Text>
                        )}
                    </View>
                    <Text
                        style={[styles.brandName, { flex: 1 }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {card.name}
                    </Text>
                </View>

                {/* Row 2: Discovery */}
                <Text style={[styles.cardInfo, { marginTop: 8 }]}>
                    Discovery - {card.discoveredInfluencers?.length ?? 0}
                </Text>

                {/* Row 3: Campaigns */}
                <Text style={[styles.cardInfo, { marginTop: 4 }]}>
                    Campaigns - {card.collaborationCount ?? 0}
                </Text>

                {/* Row 4: Industry */}
                {card.profile?.industries && card.profile.industries.length > 0 && (
                    <Text style={[styles.cardInfo, { marginTop: 4 }]} numberOfLines={1} ellipsizeMode="tail">
                        Industry: {card.profile.industries[0]}
                    </Text>
                )}

                {/* Row 5: Brand Age */}
                <Text style={[styles.cardInfo, { marginTop: 4 }]}>
                    Brand Age: {(() => {
                        if (!card.creationTime) return "";
                        const now = new Date();
                        const created = new Date(card.creationTime);
                        const diffTime = Math.abs(now.getTime() - created.getTime());
                        const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
                        if (diffYears > 5) return ">5 years";
                        if (diffYears > 3) return ">3 years";
                        if (diffYears > 1) return ">1 year";
                        return "<1 year";
                    })()}
                </Text>

                {/* Row 6: Current Plan */}
                {card.billing?.planKey && (
                    <Text style={[styles.cardInfo, { marginTop: 4 }]}>
                        Current Plan: {card.billing.planKey}
                    </Text>
                )}

                {/* Bottom Right: Joined */}
                <Text style={[styles.joinedText]}>
                    {(() => {
                        if (!card.creationTime) return "";
                        const now = new Date();
                        const created = new Date(card.creationTime);
                        const diffTime = Math.abs(now.getTime() - created.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `Joined ${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
                    })()}
                </Text>
            </Pressable>
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
            minHeight: 500,
            maxHeight: 900,
            shadowColor: colors.black,
            shadowOpacity: 0.1,
            shadowRadius: 6,
            flexShrink: 0,
        },
        columnScroll: {
            flex: 1,
            paddingBottom: 8,
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
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#E5E5E5",
        },
        cardRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,

        },
        brandImage: {
            width: 36,
            height: 36,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
        },
        brandName: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        cardInfo: {
            fontSize: 13,
            fontWeight: "500",
            color: colors.text,
            lineHeight: 18,
        },
        joinedText: {
            fontSize: 12,
            fontWeight: "400",
            color: "#9CA3AF",
            marginTop: 10,
            textAlign: "right",
            fontStyle: "italic",
        },
        cardTitle: {
            fontWeight: "600",
            paddingBottom: 4,
            marginBottom: 4,
        },
        cardDesc: {
            marginTop: 0,
            color: colors.text,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
        },
        modalContent: {
            backgroundColor: colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "90%",
            minHeight: "50%",
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5E5",
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
        },
        closeButton: {
            fontSize: 24,
            fontWeight: "700",
            color: colors.text,
        },
        modalBody: {
            padding: 20,
        },
        brandHeaderSection: {
            flexDirection: "row",
            gap: 16,
            marginBottom: 24,
        },
        brandImageLarge: {
            width: 100,
            height: 100,
            borderRadius: 12,
            backgroundColor: "#F3F4F6",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
        },
        brandInitial: {
            fontSize: 48,
            fontWeight: "700",
            color: "#6B7280",
        },
        brandInfoContainer: {
            flex: 1,
            justifyContent: "space-between",
        },
        brandNameLarge: {
            fontSize: 22,
            fontWeight: "700",
            color: colors.text,
        },
        brandNameRow: {
            flexDirection: "row",
            alignItems: "center",
            // justifyContent: "space-between",
            marginBottom: 8,
            gap: 8,
        },
        brandIconsRow: {
            flexDirection: "row",
            gap: 8,
        },
        iconButton: {
            padding: 8,
            justifyContent: "center",
            alignItems: "center",
        },
        brandMetaRow: {
            flexDirection: "row",
            marginBottom: 10,
            flexWrap: "wrap",
        },
        brandMeta: {
            fontSize: 14,
            fontWeight: "500",
            color: "#6B7280",
        },
        brandDescription: {
            fontSize: 14,
            fontWeight: "400",
            color: colors.text,
            lineHeight: 20,
            marginBottom: 12,
        },
        joinedDateLarge: {
            fontSize: 13,
            fontWeight: "400",
            color: "#9CA3AF",
            fontStyle: "italic",
            textAlign: "right",
        },
        influencersSection: {
            marginTop: 24,
            marginBottom: 20,
        },
        sectionContainer: {
            marginTop: 24,
            marginBottom: 20,
            paddingHorizontal: 20,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 12,
        },
        influencersScrollContent: {
            paddingRight: 20,
            gap: 12,
        },
        influencerCardWrapper: {
            width: 280,
            marginRight: 8,
        },
        campaignsSection: {
            marginTop: 24,
            marginBottom: 20,
        },
        campaignsScrollContent: {
            paddingRight: 20,
            gap: 12,
        },
        campaignCardWrapper: {
            width: 360,
            marginRight: 8,
        },
        campaignCard: {
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            borderRadius: 8,
            padding: 16,
            flex: 1,
        },
        campaignHeader: {
            marginBottom: 12,
        },
        campaignHeaderRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        campaignTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            flex: 1,
        },
        campaignDescription: {
            fontSize: 13,
            fontWeight: "400",
            color: "#6B7280",
            marginBottom: 12,
            lineHeight: 18,
        },
        badgesContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
        },
        badgeWithIcon: {
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            backgroundColor: "#1D425D",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
        },
        badgeText: {
            fontSize: 12,
            fontWeight: "500",
            color: colors.white,
        },
        statsGrid: {
            flexDirection: "row",
            gap: 12,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#E5E5E5",
        },
        statsLeftColumn: {
            flex: 1,
            gap: 8,
        },
        statsRightColumn: {
            flex: 1,
            gap: 8,
        },
        statBlock: {
            alignItems: "center",
        },
        statLabel: {
            fontSize: 12,
            fontWeight: "400",
            color: "#9CA3AF",
            marginBottom: 4,
        },
        statValue: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        statValueLarge: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        membersContainer: {
            gap: 12,
        },
        memberRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 8,
        },
        memberImage: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#E5E5E5",
        },
        memberInfo: {
            flex: 1,
        },
        memberName: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 4,
        },
        memberEmail: {
            fontSize: 14,
            fontWeight: "400",
            color: "#6B7280",
        },
        emptyText: {
            fontSize: 14,
            fontWeight: "400",
            color: "#9CA3AF",
            fontStyle: "italic",
        },
        subscriptionContainer: {
            gap: 12,
        },
        subscriptionRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 8,
        },
        subscriptionLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        subscriptionValue: {
            fontSize: 14,
            fontWeight: "400",
            color: "#6B7280",
        },
    });
