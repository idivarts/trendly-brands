import { Text, View } from "@/components/theme/Themed";
import stylesFn from "@/styles/empty-state/EmptyState.styles";
import { imageUrl } from "@/utils/url";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Image } from "react-native";
import { Button } from "react-native-paper";

type EmptyStateProps = {
  action?: () => void;
  actionLabel?: string;
  hideAction?: boolean;
  hideImage?: boolean;
  image?: string | NodeRequire;
  style?: any;
  subtitle?: string;
  title?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  action,
  actionLabel = "Go back",
  hideAction = false,
  hideImage = false,
  image,
  style,
  subtitle,
  title,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const navigation = useNavigation();

  const handleAction = () => {
    if (action) {
      action();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      {
        !hideImage && (
          <Image
            source={imageUrl(image)}
            width={256}
            height={256}
            style={styles.image}
          />
        )
      }
      <View
        style={styles.contentContainer}
      >
        <Text style={styles.title}>
          {title}
        </Text>
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      {
        !hideAction && (
          <Button
            mode="contained"
            onPress={handleAction}
          >
            {actionLabel}
          </Button>
        )
      }
    </View>
  );
};

export default EmptyState;
