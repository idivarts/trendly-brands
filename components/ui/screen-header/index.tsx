import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Appbar } from "react-native-paper";

interface ScreenHeaderProps {
  action?: () => void;
  title: string;
  rightAction?: () => void;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  action,
  title,
  rightAction,
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

  const handleRightAction = () => {
    if (rightAction) {
      rightAction();
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
        icon="arrow-left"
        color={Colors(theme).text}
        onPress={handleAction}
      />

      <Appbar.Content
        title={title}
        color={Colors(theme).text}
      />

      {
        rightAction && (
          <Appbar.Action
            icon="plus"
            color={Colors(theme).text}
            onPress={handleRightAction}
          />
        )
      }
    </Appbar.Header>
  );
};

export default ScreenHeader;
