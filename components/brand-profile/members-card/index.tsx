import { ManagerCard } from "@/components/members";
import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
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

  const resendInvite = async () => {
    if (!selectedBrand)
      return;

    setLoading(true)
    await HttpWrapper.fetch("/api/v1/brands/members", {
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
      console.error(e);
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderWidth: 0.3,
        borderColor: Colors(theme).gray300,
        borderRadius: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <ImageComponent
          size="small"
          shape="circle"
          initials={manager.name}
          url={manager.profileImage || ""}
          altText="Image"
        />
        <View>
          <Text style={{ fontSize: 16 }}>{manager.name}</Text>
          <Text style={{ fontSize: 16 }}>{manager.email}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {manager.status === 0 && (
          <Text style={{ color: Colors(theme).orange }}>Invite Sent</Text>
        )}
        {loading && <ActivityIndicator size="small" />}
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Pressable onPress={openMenu}>
              <FontAwesomeIcon icon={faEllipsis} />
            </Pressable>
          }
          style={{
            backgroundColor: Colors(theme).background,
            borderWidth: 0.3,
            borderColor: Colors(theme).gray300,
          }}
        >
          {manager.status === 0 &&
            <Menu.Item
              onPress={() => {
                resendInvite();
                closeMenu();
              }}
              title="Resend Invite"
              titleStyle={{ color: Colors(theme).text }}
            />}
          <Menu.Item
            onPress={() => {
              removeAction();
              closeMenu();
            }}
            title="Delete"
            titleStyle={{ color: Colors(theme).text }}
          />
        </Menu>
      </View>
    </View>
  );
};

export default MembersCard;
