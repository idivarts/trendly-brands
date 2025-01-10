import { View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Pressable } from "react-native";
import { Appbar } from "react-native-paper";

interface ScreenHeaderProps {
  action?: () => void;
  hideAction?: boolean;
  title: string;
  rightActionButton?: React.ReactNode;
  rightAction?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  action,
  hideAction = false,
  title,
  rightActionButton,
  rightAction = false,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();

  const handleAction = () => {
    if (action) {
      action();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Appbar.Header
      style={{
        backgroundColor: Colors(theme).background,
        elevation: 0,
      }}
      statusBarHeight={0}
    >
      {!hideAction && (
        <View
          style={{
            marginTop: 2,
            marginLeft: 10,
          }}
          lightColor={Colors(theme).transparent}
          darkColor={Colors(theme).transparent}
        >
          <Pressable onPress={handleAction}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={20}
              color={Colors(theme).text}
              style={{
                alignItems: "center",
              }}
            />
          </Pressable>
        </View>
      )}

      <Appbar.Content title={title} color={Colors(theme).text} />

      {rightAction && rightActionButton}
    </Appbar.Header>
  );
};

export default ScreenHeader;
