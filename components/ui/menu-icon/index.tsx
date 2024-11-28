import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import { View } from "../../theme/Themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faNavicon } from "@fortawesome/free-solid-svg-icons";

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
            <FontAwesomeIcon
              color={Colors(theme).text}
              icon={faNavicon}
              size={24}
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
