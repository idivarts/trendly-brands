import Colors from "@/constants/Colors";
import { MENU_ITEMS } from "@/constants/Menu";
import { useAuthContext, useChatContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import stylesFn from "@/styles/menu/MenuItem.styles";
import { truncateText } from "@/utils/text";
import { imageUrl } from "@/utils/url";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, ScrollView } from "react-native";
import ProfileItemCard from "../ProfileItemCard";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";

const Menu = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const router = useRouter();

  const { selectedBrand } = useBrandContext();

  const { signOutManager: signOut, manager } = useAuthContext();
  const { deregisterTokens } = useChatContext();
  const { openModal } = useConfirmationModel();

  const handleSignOut = async () => {
    setLogoutModalVisible(false);
    await deregisterTokens?.();
    await signOut();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "space-between",
      }}
    >
      <View style={styles.menuItemsContainer}>
        <View style={styles.topRow}>
          <Image
            source={imageUrl(selectedBrand?.image)}
            style={styles.avatarBrandImage}
          />
          <Text style={styles.brandName}>{selectedBrand?.name}</Text>
          {selectedBrand?.profile?.about && (
            <Text
              style={{
                fontSize: 16,
                color: Colors(theme).gray100,
              }}
            >
              {truncateText(selectedBrand?.profile?.about, 120)}
            </Text>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Button
              mode="contained"
              style={styles.menuButton}
              onPress={() => {
                router.push("/brand-profile");
              }}
            >
              Edit Brand
            </Button>
          </View>
        </View>
        <View style={styles.middleRow}>
          {MENU_ITEMS.map((item, index) => (
            <ProfileItemCard
              key={item.id}
              item={item}
              onPress={() => {
                // @ts-ignore
                router.push(item.href);
              }}
            />
          ))}
          <ProfileItemCard
            key={"logout"}
            item={{
              href: "",
              icon: faSignOut,
              id: "logout",
              title: "Logout"
            }}
            onPress={() => {
              openModal({
                title: "Logout",
                description: "Are you sure you want to logout?",
                confirmAction: handleSignOut,
                confirmText: "Logout",
              });
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default Menu;
