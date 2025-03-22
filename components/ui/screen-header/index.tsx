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
      resetAndNavigate("/explore-influencers");
    }
  };

  return (
    <Appbar.Header
      style={{
        backgroundColor: Colors(theme).background,
        elevation: 0,
        borderBottomWidth: Platform.OS === "web" ? 1 : 0,
        borderBottomColor: Colors(theme).border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}
      statusBarHeight={0}
    >
      {!hideAction && (
        <View
          style={{
            marginTop: 2,
            paddingLeft: 16,
            paddingRight: 16,
          }}
          lightColor={Colors(theme).transparent}
          darkColor={Colors(theme).transparent}
        >
          <Pressable onPress={handleAction}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={22}
              color={Colors(theme).text}
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Pressable>
        </View>
      )}

      <Appbar.Content
        style={{
          flex: 1,
          marginLeft: 12,
        }}
        color={Colors(theme).text}
        title={title}
      />

      {rightAction && (
        <View style={{ paddingRight: 16 }}>{rightActionButton}</View>
      )}
    </Appbar.Header>
  );
};

export default ScreenHeader;
