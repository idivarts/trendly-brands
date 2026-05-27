/**
 * CollaboratorsModal
 *
 * Shows the list of brand members and lets the strategy owner add any of them
 * as a collaborator on the current strategy. Already-added collaborators are
 * highlighted and can be removed.
 *
 * Usage:
 *   <CollaboratorsModal
 *     visible={visible}
 *     strategyId={strategy.id}
 *     collaboratorIds={strategy.collaboratorIds}
 *     onClose={() => setVisible(false)}
 *   />
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useStrategies } from "@/hooks/use-strategies";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faPlus, faUserGroup, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface MemberItem extends IManagers {
    managerId: string;
}

interface CollaboratorsModalProps {
    visible: boolean;
    strategyId: string;
    collaboratorIds: string[];
    onClose: () => void;
}

const CollaboratorsModal: React.FC<CollaboratorsModalProps> = ({
    visible,
    strategyId,
    collaboratorIds,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { selectedBrand } = useBrandContext();
    const { addCollaborator } = useStrategies();

    const [members, setMembers] = useState<MemberItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [toggling, setToggling] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!selectedBrand?.id) return;
        setLoading(true);
        try {
            const memberRef = collection(FirestoreDB, "brands", selectedBrand.id, "members");
            const memberSnap = await getDocs(memberRef);
            const membersData = await Promise.all(
                memberSnap.docs.map(async (memberDoc) => {
                    const managerRef = doc(FirestoreDB, "managers", memberDoc.id);
                    const managerSnap = await getDoc(managerRef);
                    return {
                        ...(managerSnap.data() as IManagers),
                        managerId: memberDoc.id,
                    } as MemberItem;
                })
            );
            setMembers(membersData);
        } finally {
            setLoading(false);
        }
    }, [selectedBrand?.id]);

    useEffect(() => {
        if (visible) fetchMembers();
    }, [visible, fetchMembers]);

    const handleToggle = useCallback(
        async (managerId: string) => {
            setToggling(managerId);
            await addCollaborator(strategyId, managerId);
            setToggling(null);
        },
        [strategyId, addCollaborator]
    );

    const renderItem = ({ item }: { item: MemberItem }) => {
        const isAdded = collaboratorIds.includes(item.managerId);
        const isLoading = toggling === item.managerId;

        return (
            <View style={styles.memberRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(item.name ?? "?").charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                </View>
                <Pressable
                    style={({ pressed }) => [
                        styles.actionBtn,
                        isAdded ? styles.actionBtnAdded : styles.actionBtnAdd,
                        pressed && styles.btnPressed,
                    ]}
                    onPress={() => handleToggle(item.managerId)}
                    disabled={isLoading || isAdded}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={isAdded ? colors.primary : colors.onPrimary} />
                    ) : (
                        <>
                            <FontAwesomeIcon
                                icon={isAdded ? faCheck : faPlus}
                                size={12}
                                color={isAdded ? colors.primary : colors.onPrimary}
                            />
                            <Text style={[styles.actionBtnText, isAdded && styles.actionBtnTextAdded]}>
                                {isAdded ? "Added" : "Add"}
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.iconWrap}>
                            <FontAwesomeIcon icon={faUserGroup} size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.title}>Collaborators</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={15} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <Text style={styles.subtitle}>
                        Add brand members who can co-edit and review this strategy.
                    </Text>

                    {loading ? (
                        <ActivityIndicator
                            style={styles.loader}
                            size="large"
                            color={colors.primary}
                        />
                    ) : (
                        <FlatList
                            data={members}
                            keyExtractor={(item) => item.managerId}
                            renderItem={renderItem}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>
                                    No other members in this brand yet.
                                </Text>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        },
        sheet: {
            width: "100%",
            maxWidth: 460,
            maxHeight: "80%",
            backgroundColor: colors.card,
            borderRadius: 18,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.16,
            elevation: 12,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        iconWrap: {
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
        },
        title: {
            flex: 1,
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        closeBtn: {
            padding: 4,
        },
        subtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            paddingHorizontal: 18,
            paddingTop: 12,
            paddingBottom: 4,
            lineHeight: 18,
        },
        list: {
            paddingHorizontal: 18,
            paddingVertical: 10,
            gap: 4,
        },
        loader: {
            marginVertical: 32,
        },
        emptyText: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            paddingVertical: 24,
        },
        memberRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        avatar: {
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
        },
        avatarText: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.primary,
        },
        memberInfo: {
            flex: 1,
            gap: 2,
        },
        memberName: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        memberEmail: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        actionBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            minWidth: 72,
            justifyContent: "center",
        },
        actionBtnAdd: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        actionBtnAdded: {
            backgroundColor: colors.aliceBlue,
        },
        actionBtnText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.onPrimary,
        },
        actionBtnTextAdded: {
            color: colors.primary,
        },
        btnPressed: {
            opacity: 0.72,
        },
    });
}

export default CollaboratorsModal;
