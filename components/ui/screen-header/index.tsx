import { View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Appbar } from "react-native-paper";

interface ScreenHeaderProps {
  action?: () => void;
  title: string;
  rightActionButton?: React.ReactNode;
  rightAction?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  action,
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
  }

  return (
    <Appbar.Header
      style={{
        backgroundColor: Colors(theme).background,
        elevation: 0,
      }}
      statusBarHeight={0}
    >
      <Appbar.Action
        icon={() => (
          <View
            style={{
              marginTop: 2,
            }}
            lightColor={Colors(theme).transparent}
            darkColor={Colors(theme).transparent}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={20}
              color={Colors(theme).text}
            />
          </View>
        )}
        color={Colors(theme).text}
        onPress={handleAction}
      />

      <Appbar.Content
        title={title}
        color={Colors(theme).text}
      />

      {
        rightAction && rightActionButton
      }
    </Appbar.Header>
  );
};

export default ScreenHeader;
