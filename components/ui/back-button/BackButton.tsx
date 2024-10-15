import { Pressable, View } from "react-native";
import { useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";

interface BackButtonProps {
  color?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  color,
}) => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <Pressable
      key={0}
      onPress={() => navigation.goBack()}
    >
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
        >
          {({ pressed }) => (
            <Ionicons
              name="chevron-back"
              size={26}
              color={color ?? Colors(theme).text}
              style={{
                opacity: pressed ? 0.8 : 1,
              }}
            />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
};

export default BackButton;
