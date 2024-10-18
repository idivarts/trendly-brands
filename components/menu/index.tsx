import { Avatar, Button } from "react-native-paper";
import { Text, View } from "../theme/Themed";
import { useAuthContext } from "@/contexts";
import { PLACEHOLDER_IMAGE, PLACEHOLDER_PERSON_IMAGE } from "@/constants/Placeholder";
import stylesFn from "@/styles/menu/MenuItem.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MENU_ITEMS } from "@/constants/Menu";
import { ImageBackground } from "react-native";

const UserData = {
  name: "John Doe",
  email: "john.doe@gmail.com",
  profileImage: "https://randomuser.me/api/portraits/men/1.jpg",
};

const BRAND_DATA = {
  brandImage: "https://images.unsplash.com/photo-1557683316-973673baf926",
};

const Menu = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const router = useRouter();

  const {
    signOutManager: signOut,
  } = useAuthContext();

  return (
    <View
      style={styles.container}
    >
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
      <View
        style={styles.menuItemsContainer}
      >
        <View
          style={styles.topRow}
        >
          <Text
            style={styles.brandName}
          >
            Apple
          </Text>
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
        <View
          style={styles.middleRow}
        >
          {
            MENU_ITEMS.map((item, index) => (
              <View
                key={index}
                style={styles.menuRow}
              >
                <Text
                  style={styles.menuRowText}
                  onPress={() => {
                    router.push(item.href);
                  }}
                >
                  {item.title}
                </Text>
              </View>
            ))
          }
        </View>
        <View
          style={styles.bottomRow}
        >
          <View
            style={styles.userProfileContainer}
          >
            <Avatar.Image
              source={{
                uri: UserData.profileImage || PLACEHOLDER_PERSON_IMAGE,
              }}
              size={56}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.titleText}>
                {UserData.name}
              </Text>
              <Text
                style={{
                  opacity: 0.8,
                }}
              >
                {UserData.email}
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
