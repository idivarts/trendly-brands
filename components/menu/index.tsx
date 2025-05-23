import { Text, View } from "../theme/Themed";
import { useAuthContext } from "@/contexts";
import stylesFn from "@/styles/menu/MenuItem.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MENU_ITEMS } from "@/constants/Menu";
import { Image, Pressable, ScrollView } from "react-native";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useState } from "react";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { imageUrl } from "@/utils/url";
import Colors from "@/constants/Colors";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import ProfileItemCard from "../ProfileItemCard";
import ImageComponent from "@/shared-uis/components/image-component";
import Button from "../ui/button";
import { truncateText } from "@/utils/text";

const Menu = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const router = useRouter();

  const { selectedBrand } = useBrandContext();

  const { signOutManager: signOut, manager } = useAuthContext();

  const handleSignOut = () => {
    setLogoutModalVisible(false);
    signOut();
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
                router.push(item.href);
              }}
            />
          ))}
        </View>
        <View style={styles.bottomRow}>
          <Pressable
            onPress={() => {
              router.push("/profile");
            }}
          >
            <View style={styles.userProfileContainer}>
              <ImageComponent
                url={manager?.profileImage || ""}
                initials={manager?.name}
                shape="circle"
                size="small"
                altText="Image"
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
              <FontAwesomeIcon
                color={Colors(theme).text}
                icon={faChevronRight}
                size={20}
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
    </ScrollView>
  );
};

export default Menu;
