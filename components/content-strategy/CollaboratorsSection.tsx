/**
 * CollaboratorsSection
 *
 * Inline collaborator picker for a content strategy. Lists every brand member
 * (excluding the current viewer) and lets the strategy owner add any of them
 * as a co-editor/reviewer. Already-added collaborators are shown as "Added"
 * and the row is disabled — removal isn't supported yet.
 *
 * This is the body of the old CollaboratorsModal, lifted out so it can be
 * embedded directly inside the ShareModal alongside public-link controls.
 */
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useStrategies } from "@/hooks/use-strategies";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faPlus, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface MemberItem extends IManagers {
    managerId: string;
}

interface CollaboratorsSectionProps {
    strategyId: string;
    collaboratorIds: string[];
}

const CollaboratorsSection: React.FC<CollaboratorsSectionProps> = ({
    strategyId,
    collaboratorIds,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();
    const { addCollaborator } = useStrategies();

    const [members, setMembers] = useState<MemberItem[]>([]);
    const [loading, setLoading] = useState(true);
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
        fetchMembers();
    }, [fetchMembers]);

    const handleToggle = useCallback(
        async (managerId: string) => {
            setToggling(managerId);
            await addCollaborator(strategyId, managerId);
            setToggling(null);
        },
        [strategyId, addCollaborator]
    );

    // Hide the current viewer — you can't invite yourself.
    const visibleMembers = useMemo(
        () => members.filter((m) => m.managerId !== manager?.id),
        [members, manager?.id]
    );

    return (
        <View style={styles.wrap}>
            <View style={styles.headerRow}>
                <View style={styles.headerIcon}>
                    <FontAwesomeIcon icon={faUserGroup} size={14} color={colors.primary} />
                </View>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.title}>Invite collaborators</Text>
                    <Text style={styles.subtitle}>
                        Brand members you add can co-edit and review this strategy.
                    </Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator
                    style={styles.loader}
                    size="small"
                    color={colors.primary}
                />
            ) : visibleMembers.length === 0 ? (
                <Text style={styles.emptyText}>
                    No other members in this brand yet.
                </Text>
            ) : (
                <View style={styles.list}>
                    {visibleMembers.map((item) => {
                        const isAdded = collaboratorIds.includes(item.managerId);
                        const isLoading = toggling === item.managerId;
                        return (
                            <View key={item.managerId} style={styles.memberRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {(item.name ?? "?").charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.memberEmail} numberOfLines={1}>
                                        {item.email}
                                    </Text>
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
                                        <ActivityIndicator
                                            size="small"
                                            color={isAdded ? colors.primary : colors.onPrimary}
                                        />
                                    ) : (
                                        <>
                                            <FontAwesomeIcon
                                                icon={isAdded ? faCheck : faPlus}
                                                size={11}
                                                color={isAdded ? colors.primary : colors.onPrimary}
                                            />
                                            <Text
                                                style={[
                                                    styles.actionBtnText,
                                                    isAdded && styles.actionBtnTextAdded,
                                                ]}
                                            >
                                                {isAdded ? "Added" : "Add"}
                                            </Text>
                                        </>
                                    )}
                                </Pressable>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrap: {
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.tag,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        headerIcon: {
            width: 28,
            height: 28,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        headerTextWrap: {
            flex: 1,
            minWidth: 0,
        },
        title: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
            lineHeight: 16,
        },
        loader: {
            marginVertical: 16,
        },
        list: {
            marginTop: 10,
            gap: 4,
        },
        memberRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 8,
            paddingHorizontal: 8,
            borderRadius: 10,
            backgroundColor: colors.card,
        },
        avatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
        },
        avatarText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        memberInfo: {
            flex: 1,
            minWidth: 0,
            gap: 1,
        },
        memberName: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
        memberEmail: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        actionBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            minWidth: 68,
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
        emptyText: {
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: "center",
            paddingVertical: 16,
        },
    });
}

export default CollaboratorsSection;
