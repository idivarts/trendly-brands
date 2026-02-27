import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { collection, deleteDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
} from "react-native";
import MembersCard from "../brand-profile/members-card";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";
import MembersModal from "../ui/modal/MembersModal";

export interface ManagerCard extends IManagers {
    managerId: string;
    status: number;
}

const Members = () => {
    const theme = useTheme();
    const { xl, width } = useBreakpoints();
    const { selectedBrand } = useBrandContext();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors, xl, width), [colors, xl, width]);

    const [members, setMembers] = useState<ManagerCard[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);

    const fetchMembers = async () => {
        if (!selectedBrand) return;
        try {
            const memberRef = collection(
                FirestoreDB,
                "brands",
                selectedBrand.id,
                "members"
            );
            const memberDoc = await getDocs(memberRef);
            const membersData = memberDoc.docs.map((doc) => {
                return {
                    ...doc.data(),
                    managerId: doc.id,
                } as ManagerCard;
            });

            const members = await Promise.all(
                membersData.map(async (member) => {
                    const memberDoc = doc(FirestoreDB, "managers", member.managerId);
                    const memberData = getDoc(memberDoc).then((doc) => {
                        return {
                            ...doc.data(),
                            managerId: doc.id,
                            status: member.status,
                        } as ManagerCard;
                    });
                    return memberData;
                })
            );

            setMembers(members);
        } catch (error) {
            Console.error(error);
        }
    };

    const removeMember = async (manager: ManagerCard) => {
        if (!selectedBrand)
            return
        const memberRef = doc(FirestoreDB, "brands", selectedBrand.id, "members", manager.managerId)
        await deleteDoc(memberRef).then(() => {
            Toaster.success("Successfully deleted the user")
            handleRefresh()
        }).catch(e => {
            Toaster.error("Cant delete this member!")
        })
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchMembers();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchMembers();
    }, [selectedBrand]);

    return (
        <View style={styles.container}>
            {xl && (
                <View style={styles.header}>
                    <Text style={styles.title}>Members</Text>
                    <Button onPress={() => setShowMemberModal(true)}>
                        Add Member
                    </Button>
                </View>
            )}

            <FlatList
                data={members}
                renderItem={({ item }) => (
                    <View style={xl ? styles.cardWrapper : undefined}>
                        <MembersCard
                            manager={item}
                            cardType="preferences"
                            removeAction={() => removeMember(item)}
                        />
                    </View>
                )}
                keyExtractor={(item) => item.managerId}
                contentContainerStyle={styles.listContent}
                style={styles.list}
                numColumns={xl ? 2 : 1}
                columnWrapperStyle={xl ? styles.columnWrapper : undefined}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                    />
                }
            />

            {!xl && (
                <Button onPress={() => setShowMemberModal(true)} style={styles.addButton}>
                    Add Member
                </Button>
            )}

            <MembersModal
                visible={showMemberModal}
                handleModalClose={() => setShowMemberModal(false)}
                refresh={fetchMembers}
                theme={theme}
            />
        </View>
    );
};

function createStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    width: number
) {
    const contentMaxWidth = Math.min(width - 48, 960);
    const horizontalPadding = xl ? 24 : 10;
    const listGap = xl ? 16 : 10;

    return StyleSheet.create({
        container: {
            flex: 1,
            padding: horizontalPadding,
            backgroundColor: colors.background,
            ...(xl && { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }),
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            paddingVertical: 8,
        },
        title: {
            fontSize: 24,
            fontWeight: "700",
            color: colors.text,
        },
        list: {
            flex: 1,
        },
        listContent: {
            gap: listGap,
            paddingBottom: xl ? 24 : 16,
        },
        columnWrapper: {
            gap: listGap,
        },
        cardWrapper: {
            flex: 1,
            minWidth: 0,
        },
        addButton: {
            marginTop: 12,
        },
    });
}

export default Members;
