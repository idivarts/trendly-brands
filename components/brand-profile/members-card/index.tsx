import { ManagerCard } from "@/components/preferences";
import { View, Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import ImageComponent from "@/shared-uis/components/image-component";
import { imageUrl } from "@/utils/url";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { FC, useState } from "react";
import { Pressable } from "react-native";
import { Avatar, Menu } from "react-native-paper";

interface MembersCardProps {
  manager: ManagerCard;
  cardType: string;
  action: () => void;
}

const MembersCard: FC<MembersCardProps> = ({ manager, cardType, action }) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false); // State to handle menu visibility

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

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
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Pressable onPress={openMenu}>
              <FontAwesomeIcon icon={faEllipsisH} />
            </Pressable>
          }
          style={{
            backgroundColor: Colors(theme).background,
            borderWidth: 0.3,
            borderColor: Colors(theme).gray300,
          }}
        >
          <Menu.Item
            onPress={() => {
              action();
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
