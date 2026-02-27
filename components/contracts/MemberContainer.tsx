import Colors from "@/shared-uis/constants/Colors";
import { useChatContext } from "@/contexts";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { faEllipsis, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import React, { FC, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ActivityIndicator, Menu } from "react-native-paper";
import ImageComponent from "@/shared-uis/components/image-component";
import { Text } from "../theme/Themed";

interface MemberContainerProps {
    channelId: string;
    setMembersFromBrand: (members: any[]) => void;
    updateMemberContainer: number;
    setShowModal: () => void;
    title?: string;
}

const MemberContainer: FC<MemberContainerProps> = ({
    channelId,
    setMembersFromBrand,
    updateMemberContainer,
    setShowModal,
    title = "Members",
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { fetchMembers, removeMemberFromChannel, isStreamConnected } =
        useChatContext();
    const [members, setMembers] = React.useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);

    const fetchMembersFromClient = async () => {
        setLoading(true);
        try {
            const membersList = await fetchMembers(channelId);
            const memberData = await Promise.all(
                membersList.map(async (member: any) => {
                    const memberRef = doc(
                        FirestoreDB,
                        "managers",
                        member.user.id
                    );
                    const memberDoc = await getDoc(memberRef);
                    const data = {
                        ...memberDoc.data(),
                        email: memberDoc.data()?.email,
                        managerId: member.user.id,
                    };
                    if (data && data.email) {
                        return data;
                    }
                    return null;
                })
            );
            const validMembers = memberData.filter((data) => data !== null);
            setMembers(validMembers);
            setMembersFromBrand(validMembers);
        } catch (e) {
            Console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isStreamConnected) return;
        fetchMembersFromClient();
    }, [updateMemberContainer, isStreamConnected]);

    const handleRemove = async (item: any) => {
        setMenuVisibleId(null);
        await removeMemberFromChannel(channelId, item.managerId).then(() => {
            fetchMembersFromClient();
        });
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable
                    onPress={setShowModal}
                    style={styles.addButton}
                    accessibilityRole="button"
                >
                    <FontAwesomeIcon
                        icon={faPlus}
                        size={20}
                        color={colors.text}
                    />
                </Pressable>
            </View>
            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : (
                <View style={styles.memberList}>
                    {members.map((item) => (
                        <View
                            key={item.managerId}
                            style={styles.memberRow}
                        >
                            <ImageComponent
                                size="small"
                                shape="circle"
                                initials={item.name}
                                url={item.profileImage || ""}
                                altText={item.name}
                            />
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>
                                    {item.name}
                                </Text>
                                <Text style={styles.memberEmail}>
                                    {item.email}
                                </Text>
                            </View>
                            <Menu
                                visible={menuVisibleId === item.managerId}
                                onDismiss={() => setMenuVisibleId(null)}
                                anchor={
                                    <Pressable
                                        onPress={() =>
                                            setMenuVisibleId(
                                                menuVisibleId === item.managerId
                                                    ? null
                                                    : item.managerId
                                            )
                                        }
                                        style={styles.menuButton}
                                    >
                                        <FontAwesomeIcon
                                            icon={faEllipsis}
                                            color={colors.text}
                                            size={16}
                                        />
                                    </Pressable>
                                }
                                contentStyle={{
                                    backgroundColor: colors.card,
                                }}
                            >
                                <Menu.Item
                                    onPress={() => handleRemove(item)}
                                    title="Remove"
                                    titleStyle={{
                                        color: colors.text,
                                        fontWeight: "600",
                                    }}
                                />
                            </Menu>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            width: "100%",
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 0.3,
            borderColor: colors.gray300,
            padding: 16,
            gap: 16,
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        title: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        addButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.gray200,
            alignItems: "center",
            justifyContent: "center",
        },
        loader: {
            paddingVertical: 16,
        },
        memberList: {
            gap: 12,
        },
        memberRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        memberInfo: {
            flex: 1,
            gap: 2,
            minWidth: 0,
        },
        memberName: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
        },
        memberEmail: {
            fontSize: 14,
            color: colors.gray100,
        },
        menuButton: {
            padding: 8,
        },
    });
}

export default MemberContainer;
