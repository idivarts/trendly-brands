import { Pressable, View } from "react-native";
import { useNavigation } from "expo-router";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

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
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={20}
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
