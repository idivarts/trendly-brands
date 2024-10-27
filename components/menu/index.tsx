import { Avatar, Button } from "react-native-paper";
import { Text, View } from "../theme/Themed";
import { useAuthContext } from "@/contexts";
import {
  PLACEHOLDER_IMAGE,
  PLACEHOLDER_PERSON_IMAGE,
} from "@/constants/Placeholder";
import stylesFn from "@/styles/menu/MenuItem.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MENU_ITEMS } from "@/constants/Menu";
import { ImageBackground } from "react-native";

const BRAND_DATA = {
  brandImage: "https://images.unsplash.com/photo-1557683316-973673baf926",
};

const Menu = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const router = useRouter();

  const { signOutManager: signOut, manager } = useAuthContext();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1557683316-973673baf926",
        }}
        style={styles.backgroundImage}
      />
      <Avatar.Image
        source={{
          uri: BRAND_DATA.brandImage || PLACEHOLDER_IMAGE,
        }}
        size={72}
        style={styles.brandAvatar}
      />
      <View style={styles.menuItemsContainer}>
        <View style={styles.topRow}>
          <Text style={styles.brandName}>Apple</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
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
          <View style={styles.userProfileContainer}>
            <Avatar.Image
              source={{
                uri: manager?.profileImage || PLACEHOLDER_PERSON_IMAGE,
              }}
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
          </View>
          <Button
            mode="contained"
            style={styles.menuButton}
            onPress={() => {
              signOut();
            }}
          >
            Logout
          </Button>
        </View>
      </View>
    </View>
  );
};

export default Menu;
