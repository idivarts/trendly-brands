import Colors from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import { View } from "../../theme/Themed";

const MenuIcon: React.FC = () => {
  const theme = useTheme();

  return (
    <Link href="/menu" asChild>
      <Pressable>
        {({ pressed }) => (
          <View
            style={{
              position: "relative",
              marginRight: 15,
            }}
          >
            <FontAwesome
              name="navicon"
              size={25}
              color={Colors(theme).text}
              style={{
                zIndex: 0,
                opacity: pressed ? 0.5 : 1,
              }}
            />
          </View>
        )}
      </Pressable>
    </Link>
  );
};

export default MenuIcon;
