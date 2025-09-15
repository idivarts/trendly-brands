import { View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { resetAndNavigate } from "@/utils/router";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Platform, Pressable } from "react-native";
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
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      resetAndNavigate("/discover");
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
            paddingHorizontal: 16,
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

      <Appbar.Content
        style={{
          flex: 1,
          marginLeft: Platform.OS === "web" ? 12 : 16,
        }}
        color={Colors(theme).text}
        title={title}
      />

      {rightAction && rightActionButton}
    </Appbar.Header>
  );
};

export default ScreenHeader;
