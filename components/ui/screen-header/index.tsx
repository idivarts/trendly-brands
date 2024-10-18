import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Appbar } from "react-native-paper";

interface ScreenHeaderProps {
  action?: () => void;
  title: string;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  action,
  title,
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
        icon="arrow-left"
        color={Colors(theme).text}
        onPress={handleAction}
      />

      <Appbar.Content
        title={title}
        color={Colors(theme).text}
      />
    </Appbar.Header>
  );
};

export default ScreenHeader;
