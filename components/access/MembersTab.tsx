import { Text, View } from "@/components/theme/Themed";
import MembersModal from "@/components/ui/modal/MembersModal";
import { roleLabel } from "@/constants/Access";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet } from "react-native";
import { listTeams, Team } from "./api";
import MemberAccessModal, { EditableMember } from "./MemberAccessModal";

interface MembersTabProps {
    showInviteModal: boolean;
    onCloseInvite: () => void;
}

const initialsOf = (name?: string, email?: string) => {
    const base = (name || email || "?").trim();
    const parts = base.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
};

const MembersTab: React.FC<MembersTabProps> = ({ showInviteModal, onCloseInvite }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(() => createStyles(colors, xl, width), [colors, xl, width]);
    const { selectedBrand } = useBrandContext();

    const [members, setMembers] = useState<EditableMember[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [editing, setEditing] = useState<EditableMember | null>(null);

    const fetchMembers = async () => {
        if (!selectedBrand) return;
        try {
            const memberRef = collection(FirestoreDB, "brands", selectedBrand.id, "members");
            const memberDocs = await getDocs(memberRef);
            const rows = await Promise.all(
                memberDocs.docs.map(async (m) => {
                    const data = m.data() as any;
                    const profileSnap = await getDoc(doc(FirestoreDB, "managers", m.id));
                    const profile = (profileSnap.data() as any) || {};
                    return {
                        managerId: m.id,
                        name: profile.name,
                        email: profile.email,
                        role: data.role,
                        teamIds: data.teamIds ?? [],
                        overrides: data.overrides ?? {},
                        status: data.status ?? 0,
                        profileImage: profile.profileImage,
                    } as EditableMember & { profileImage?: string };
                }),
            );
            setMembers(rows);
        } catch (error) {
            Console.error(error);
        }
    };

    const fetchTeams = async () => {
        if (!selectedBrand) return;
        listTeams(selectedBrand.id).then(setTeams).catch(() => setTeams([]));
    };

    useEffect(() => {
        fetchMembers();
        fetchTeams();
    }, [selectedBrand]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchMembers();
        await fetchTeams();
        setRefreshing(false);
    };

    const renderRow = ({ item }: { item: EditableMember & { profileImage?: string } }) => (
        <Pressable style={styles.row} onPress={() => setEditing(item)}>
            <View style={styles.avatar}>
                {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} style={styles.avatarImg} />
                ) : (
                    <Text style={styles.avatarText}>{initialsOf(item.name, item.email)}</Text>
                )}
            </View>
            <View style={styles.rowBody}>
                <Text style={styles.name}>{item.name || item.email || "Member"}</Text>
                {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
            </View>
            <View style={styles.rowMeta}>
                {item.status === 0 ? (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                ) : null}
                <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{roleLabel(item.role)}</Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={members}
                renderItem={renderRow}
                keyExtractor={(item) => item.managerId}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
                }
            />

            {selectedBrand ? (
                <MemberAccessModal
                    visible={!!editing}
                    onClose={() => setEditing(null)}
                    theme={theme}
                    brandId={selectedBrand.id}
                    member={editing}
                    teams={teams}
                    onSaved={fetchMembers}
                />
            ) : null}

            <MembersModal
                visible={showInviteModal}
                handleModalClose={onCloseInvite}
                refresh={() => {
                    fetchMembers();
                    fetchTeams();
                }}
                theme={theme}
            />
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, xl: boolean, width: number) {
    const contentMaxWidth = Math.min(width - 48, 880);
    return StyleSheet.create({
        container: {
            flex: 1,
            padding: xl ? 24 : 12,
            backgroundColor: colors.background,
            ...(xl && { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }),
        },
        listContent: {
            gap: 10,
            paddingBottom: 24,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        avatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.tag,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
        },
        avatarImg: {
            width: 44,
            height: 44,
        },
        avatarText: {
            fontSize: 15,
            fontWeight: "700",
        },
        rowBody: {
            flex: 1,
            gap: 2,
        },
        name: {
            fontSize: 15,
            fontWeight: "600",
        },
        email: {
            fontSize: 12,
            opacity: 0.6,
        },
        rowMeta: {
            alignItems: "flex-end",
            gap: 6,
        },
        roleBadge: {
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 12,
            backgroundColor: colors.primary,
        },
        roleBadgeText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.onPrimary,
        },
        pendingBadge: {
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        pendingText: {
            fontSize: 11,
            color: colors.orange,
            fontWeight: "600",
        },
    });
}

export default MembersTab;
