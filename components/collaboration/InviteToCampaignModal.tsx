import { useBrandContext } from "@/contexts/brand-context.provider";
import { processRawAttachment } from "@/shared-libs/utils/attachments";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Video } from "expo-av";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Checkbox } from "react-native-paper";

type Collaboration = {
    id: string;
    name: string;
    description: string;
    mediaUrl?: string;
    isVideo?: boolean;
    active?: boolean;
};

type Props = {
    onClose: () => void;
    onInvite: (selectedIds: string[]) => void;
    // optional influencers being invited. If provided, the modal header should reflect it
    influencers?: { id: string; name?: string }[];
};

const InviteToCampaignModal: React.FC<Props> = ({ onClose, onInvite, influencers }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const { selectedBrand } = useBrandContext();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveCollaborations = async () => {
            try {
                setLoading(true);

                if (!selectedBrand) return;

                const coll = collection(FirestoreDB, "collaborations");
                const q = query(
                    coll,
                    where("brandId", "==", selectedBrand.id),
                    where("status", "==", "active"),
                    orderBy("timeStamp", "desc")
                );

                const snap = await getDocs(q);

                const items = snap.docs.map((d) => {
                    const data = d.data() as any;
                    const attachments = Array.isArray(data.attachments)
                        ? data.attachments
                        : [];
                    const first = attachments[0];
                    const processed = first ? processRawAttachment(first) : undefined;

                    return {
                        id: d.id,
                        name: data.name || "",
                        description: data.description || "",
                        mediaUrl:
                            processed?.url ||
                            first?.imageUrl ||
                            first?.url ||
                            "https://via.placeholder.com/300x200.png?text=No+Image",
                        isVideo: processed?.type?.includes("video") || false,
                        active: true,
                    };
                });

                setCollaborations(items);
            } catch (err) {
                console.warn("Failed to load active collaborations", err);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveCollaborations();
    }, [selectedBrand]);

    const toggleSelect = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleInvite = () => {
        onInvite(selected);
        setSelected([]);
        onClose();
    };

    const handleClose = () => {
        setSelected([]);
        onClose();
    };

    const renderItem = ({ item }: { item: Collaboration }) => {
        if (!item.active) return null;
        const isSelected = selected.includes(item.id);

        return (
            <Pressable
                onPress={() => toggleSelect(item.id)}
                style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                    { backgroundColor: Colors(theme).InfluencerStatCard },
                ]}
            >
                {/* Media */}
                {item.isVideo ? (
                    <Video
                        source={{ uri: item.mediaUrl ?? "https://via.placeholder.com/150" }}
                        style={styles.media}
                        shouldPlay={false}
                        isMuted
                    />
                ) : (
                    <Image
                        source={{ uri: item.mediaUrl ?? "https://via.placeholder.com/150" }}
                        style={styles.media}
                        resizeMode="cover"
                    />
                )}

                {/* Info */}
                <View style={styles.info}>
                    <Text numberOfLines={1} style={styles.name}>
                        {item.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.description}>
                        {item.description}
                    </Text>
                </View>

                {/* Checkbox */}
                <Checkbox
                    status={isSelected ? "checked" : "unchecked"}
                    onPress={() => toggleSelect(item.id)}
                // color={Colors(theme).InfluencerStatCard}
                // uncheckedColor={Colors(theme).InfluencerStatCard}
                />
            </Pressable>
        );
    };

    return (
        <Modal visible={true} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.aliceBlue }]}>
                    <Text style={styles.header}>
                        {influencers && influencers?.length > 1
                            ? `Inviting ${influencers.length} influencers`
                            : influencers && influencers?.length === 1
                                ? `Inviting ${influencers[0].name ?? "influencer"}`
                                : "Invite to Campaign"}
                    </Text>

                    {loading ? (
                        <Text style={{ textAlign: "center", marginVertical: 20 }}>
                            Loading...
                        </Text>
                    ) : collaborations.length === 0 ? (
                        <Text style={{ textAlign: "center", marginVertical: 20 }}>
                            No collaborations found
                        </Text>
                    ) : (
                        <FlatList
                            data={collaborations}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                    <View style={styles.footer}>
                        <Pressable onPress={handleClose} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleInvite}
                            style={[
                                styles.inviteBtn,
                                selected.length === 0 && { opacity: 0.6 },
                            ]}
                            disabled={selected.length === 0}
                        >
                            <Text style={styles.inviteText}>Invite Now</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: colors.backdrop,
            justifyContent: "center",
            alignItems: "center",
        },
        container: {
            minWidth: 640,
            maxHeight: "80%",
            borderRadius: 12,
            padding: 16,
            maxWidth: 700,
        },
        header: {
            fontSize: 18,
            fontWeight: "600",
            marginBottom: 10,
        },
        listContent: {
            paddingBottom: 80,
        },
        card: {
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 10,
            marginBottom: 10,
            padding: 8,
        },
        cardSelected: {
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: colors.background,
        },
        media: {
            width: 60,
            height: 60,
            borderRadius: 8,
            marginLeft: 6,
        },
        info: {
            flex: 1,
            marginLeft: 10,
            rowGap: 8,
        },
        name: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
        },
        description: {
            fontSize: 13,
            color: colors.text,
        },
        footer: {
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 15,
        },
        cancelBtn: {
            marginRight: 10,
            padding: 10,
        },
        cancelText: {
            color: colors.primary,
        },
        inviteBtn: {
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 18,
        },
        inviteText: {
            color: colors.white,
            fontWeight: "600",
        },
    });

export default InviteToCampaignModal;
