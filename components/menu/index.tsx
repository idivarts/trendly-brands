import { Avatar, Button } from "react-native-paper";
import { Text, View } from "../theme/Themed";
import { useAuthContext } from "@/contexts";
import stylesFn from "@/styles/menu/MenuItem.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MENU_ITEMS } from "@/constants/Menu";
import { ImageBackground, Pressable } from "react-native";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useState } from "react";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { imageUrl } from "@/utils/url";

const Menu = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const router = useRouter();

  const {
    selectedBrand,
  } = useBrandContext();

  const { signOutManager: signOut, manager } = useAuthContext();

  const handleSignOut = () => {
    setLogoutModalVisible(false);
    signOut();
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={imageUrl(selectedBrand?.image)}
        resizeMode="cover"
        style={styles.backgroundImage}
      />
      <Avatar.Image
        source={imageUrl(selectedBrand?.image)}
        size={72}
        style={styles.brandAvatar}
      />
      <View style={styles.menuItemsContainer}>
        <View
          style={{
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          <View style={styles.topRow}>
            <Text style={styles.brandName}>{selectedBrand?.name}</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
              }}
            >
              <Button
                mode="contained"
                style={styles.menuButton}
                onPress={() => {
                  router.push("/brand-profile");
                }}
              >
                View Profile
              </Button>
            </View>
          </View>
        </View>
        <View style={styles.middleRow}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.id} style={styles.menuRow}>
              <Text
                style={styles.menuRowText}
                onPress={() => {
                  //@ts-ignore
                  router.push(item.href);
                }}
              >
                {item.title}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.bottomRow}>
          <Pressable
            onPress={() => {
              router.push("/profile");
            }}
          >
            <View style={styles.userProfileContainer}>
              <Avatar.Image
                source={
                  manager?.profileImage ? {
                    uri: manager?.profileImage,
                  } : require("@/assets/images/placeholder-person-image.png")
                }
                size={56}
                style={styles.avatar}
              />
              <View style={styles.textContainer}>
                <Text style={styles.titleText}>{manager?.name}</Text>
                <Text
                  style={{
                    opacity: 0.8,
                  }}
                >
                  {manager?.email}
                </Text>
              </View>
              <Avatar.Icon
                icon="chevron-right"
                size={28}
                style={styles.chevron}
              />
            </View>
          </Pressable>
          <Button
            mode="contained"
            style={styles.menuButton}
            onPress={() => {
              setLogoutModalVisible(true);
            }}
          >
            Logout
          </Button>
        </View>
      </View>
      <ConfirmationModal
        cancelAction={() => setLogoutModalVisible(false)}
        confirmAction={handleSignOut}
        confirmText="Logout"
        description="Are you sure you want to logout?"
        setVisible={setLogoutModalVisible}
        visible={logoutModalVisible}
      />
    </View>
  );
};

export default Menu;
