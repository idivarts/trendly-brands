import { MOCK_CONTENT_ITEMS } from "@/components/contents/mock-data";
import { CONTENT_TYPE_LABELS } from "@/components/content-calendar/types";
import { ContentItem } from "@/components/contents/types";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarDays,
    faCheckCircle,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { CollabContentSource } from "./CreateCollabFromContentModal";

interface ContentPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (source: CollabContentSource) => void;
}

const TYPE_COLORS: Record<string, string> = {
    reel: "#6C47FF",
    post: "#1A7A3A",
    story: "#E07A00",
    carousel: "#0070CC",
    live: "#CC0044",
};

const ContentPickerModal: React.FC<ContentPickerModalProps> = ({
    visible,
    onClose,
    onSelect,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const approvedItems = useMemo(
        () => MOCK_CONTENT_ITEMS.filter((i) => i.status === "approved"),
        []
    );

    const handleSelect = (item: ContentItem) => {
        setSelectedId(item.id);
        const source: CollabContentSource = {
            contentId: item.id,
            title: item.title,
            idea: item.idea,
            type: item.type,
            date: item.date,
        };
        onSelect(source);
        setSelectedId(null);
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            <Text style={styles.headerTitle}>Select Approved Content</Text>
                            <Text style={styles.headerSub}>
                                Choose a piece of approved content to base this collab on
                            </Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {approvedItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No approved content yet</Text>
                            <Text style={styles.emptySub}>
                                Approve content pieces first before creating a collaboration from them.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={approvedItems}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const typeColor = TYPE_COLORS[item.type] ?? colors.primary;
                                const isSelected = selectedId === item.id;

                                return (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.card,
                                            isSelected && styles.cardSelected,
                                            pressed && styles.cardPressed,
                                        ]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <View style={[styles.accent, { backgroundColor: typeColor }]} />
                                        <View style={styles.cardBody}>
                                            <View style={styles.cardTopRow}>
                                                <View style={[styles.typeChip, { backgroundColor: typeColor + "1A" }]}>
                                                    <Text style={[styles.typeChipText, { color: typeColor }]}>
                                                        {CONTENT_TYPE_LABELS[item.type]}
                                                    </Text>
                                                </View>
                                                <View style={styles.approvedBadge}>
                                                    <FontAwesomeIcon
                                                        icon={faCheckCircle}
                                                        size={11}
                                                        color="#1A7A3A"
                                                    />
                                                    <Text style={styles.approvedText}>Approved</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.cardTitle} numberOfLines={2}>
                                                {item.title}
                                            </Text>
                                            {item.idea ? (
                                                <Text style={styles.cardIdea} numberOfLines={1}>
                                                    {item.idea}
                                                </Text>
                                            ) : null}
                                            <View style={styles.cardFooter}>
                                                <FontAwesomeIcon
                                                    icon={faCalendarDays}
                                                    size={11}
                                                    color={colors.textSecondary}
                                                />
                                                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                );
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    justifyContent: "flex-end",
                },
                sheet: {
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: "80%",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowRadius: 20,
                    shadowOpacity: 0.12,
                    elevation: 16,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                },
                headerText: { flex: 1, gap: 3 },
                headerTitle: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                },
                headerSub: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 17,
                },
                closeBtn: { padding: 4 },
                list: {
                    paddingHorizontal: 16,
                    paddingTop: 8,
                    paddingBottom: 32,
                    gap: 10,
                },
                card: {
                    flexDirection: "row",
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                cardSelected: {
                    shadowColor: colors.primary,
                    shadowOpacity: 0.25,
                    elevation: 5,
                },
                cardPressed: { opacity: 0.76 },
                accent: { width: 4, flexShrink: 0 },
                cardBody: {
                    flex: 1,
                    padding: 14,
                    gap: 6,
                },
                cardTopRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                },
                typeChip: {
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 6,
                },
                typeChipText: {
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                },
                approvedBadge: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: "rgba(26,122,58,0.12)",
                },
                approvedText: {
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#1A7A3A",
                },
                cardTitle: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                    lineHeight: 20,
                },
                cardIdea: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 17,
                },
                cardFooter: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 2,
                },
                cardDate: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
                emptyState: {
                    padding: 32,
                    alignItems: "center",
                    gap: 8,
                },
                emptyTitle: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                },
                emptySub: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 19,
                },
            }),
        [colors]
    );
}

export default ContentPickerModal;
