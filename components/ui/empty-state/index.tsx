import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import stylesFn from "@/styles/empty-state/EmptyState.styles";
import { useTheme } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { Image } from "react-native";
import { Button } from "react-native-paper";

type EmptyStateProps = {
  hideAction?: boolean;
  actionHref?: string;
  actionLabel?: string;
  image?: string;
  subtitle?: string;
  title: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  hideAction = false,
  actionHref,
  actionLabel = "Go back",
  image,
  subtitle,
  title,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const router = useRouter();
  const navigation = useNavigation();

  return (
    <View
      style={styles.container}
    >
      <Image
        source={image ?? require("../../../assets/images/placeholder-image.jpg")}
        width={50}
        height={50}
        style={styles.image}
      />
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
            onPress={() => actionHref ? router.push(actionHref) : navigation.goBack()}
            style={styles.action}
            textColor={Colors(theme).text}
          >
            {actionLabel}
          </Button>
        )
      }
    </View>
  );
};

export default EmptyState;
