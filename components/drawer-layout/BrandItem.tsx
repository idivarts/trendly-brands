import { useTheme } from "@react-navigation/native";
import { Pressable } from "react-native";
import { Text, View } from "../theme/Themed";
import Colors from "@/constants/Colors";
import stylesFn from "@/styles/brand-item/BrandItem.styles";

interface BrandItemProps {
  active?: boolean;
  onPress: () => void;
  title: string;
}

const BrandItem: React.FC<BrandItemProps> = ({
  active,
  onPress,
  title,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: active ? Colors(theme).primary : Colors(theme).background,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: active ? Colors(theme).white : Colors(theme).text,
            },
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

export default BrandItem;
