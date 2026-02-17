import { ManagerCard } from "@/components/members";
import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { FC, useState } from "react";
import { Pressable } from "react-native";
import { ActivityIndicator, Menu } from "react-native-paper";

interface MembersCardProps {
    manager: ManagerCard;
    cardType: string;
    removeAction: () => void;
}

const MembersCard: FC<MembersCardProps> = ({ manager, cardType, removeAction }) => {
    const theme = useTheme();
    const [menuVisible, setMenuVisible] = useState(false); // State to handle menu visibility

    const [loading, setLoading] = useState(false)

    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);
    const { selectedBrand } = useBrandContext()

    const deleteAction = async () => {
        try {
            setLoading(true)
            await removeAction()
        } finally {
            setLoading(false)
        }
    }

    const resendInvite = async () => {
        if (!selectedBrand)
            return;

        setLoading(true)
        await HttpWrapper.fetch("/api/v2/brands/members", {
            method: "POST",
            body: JSON.stringify({
                brandId: selectedBrand.id,
                email: manager.email,
            }),
            headers: {
                "content-type": "application/json"
            }
        }).then(async (res) => {
            const data = await res.json()
            Toaster.success("User ReInvited Successfully");
        }).catch((e) => {
            Toaster.error("Something wrong happened");
            Console.error(e);
        }).finally(() => {
            setLoading(false)
        })
    }

    if (!manager) {
        return null;
    }

    return (
        <View
            style={{
                backgroundColor: Colors(theme).primary,
                borderRadius: 14,
                shadowColor: Colors(theme).primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 5,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: Colors(theme).card,
                    gap: 16,
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                    }}
                >
                    <View
                        style={{
                            borderRadius: 50,
                            padding: 2,
                            shadowColor: Colors(theme).primary,
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                    >
                        <ImageComponent
                            size="small"
                            shape="circle"
                            initials={manager.name}
                            url={manager.profileImage || ""}
                            altText="Image"
                        />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600" }}>
                            {manager.name}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                // color: Colors(theme).gray600,
                            }}
                        >
                            {manager.email}
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        backgroundColor: "transparent",
                    }}
                >
                    {manager.status === 0 && (
                        <View
                            style={{
                                backgroundColor: Colors(theme).orange + "20",
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                                shadowColor: Colors(theme).orange,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 2,
                            }}
                        >
                            <Text
                                style={{
                                    color: Colors(theme).orange,
                                    fontSize: 12,
                                    fontWeight: "600",
                                }}
                            >
                                Invite Sent
                            </Text>
                        </View>
                    )}
                    {loading && <ActivityIndicator size="small" color={Colors(theme).primary} />}
                    <Menu
                        visible={menuVisible}
                        onDismiss={closeMenu}
                        anchor={
                            <Pressable
                                onPress={openMenu}
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    backgroundColor: Colors(theme).background,
                                    shadowColor: Colors(theme).primary,
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 3,
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faEllipsis}
                                    color={Colors(theme).primary}
                                    size={18}
                                />
                            </Pressable>
                        }
                        style={{
                            backgroundColor: Colors(theme).card,
                            shadowColor: Colors(theme).primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 6,
                            elevation: 4,
                        }}
                    >
                        {manager.status === 0 && (
                            <Menu.Item
                                onPress={() => {
                                    resendInvite();
                                    closeMenu();
                                }}
                                title="Resend Invite"
                                titleStyle={{
                                    color: Colors(theme).text,
                                    fontWeight: "600",
                                }}
                            />
                        )}
                        <Menu.Item
                            onPress={() => {
                                deleteAction();
                                closeMenu();
                            }}
                            title="Delete"
                            titleStyle={{
                                color: Colors(theme).text,
                                fontWeight: "600",
                            }}
                        />
                    </Menu>
                </View>
            </View>
        </View>
    );
};

export default MembersCard;
