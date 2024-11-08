import { useTheme } from "@react-navigation/native";
import { Pressable } from "react-native";
import { Text, View } from "../theme/Themed";
import Colors from "@/constants/Colors";
import stylesFn from "@/styles/brand-item/BrandItem.styles";
import { Avatar, IconButton } from "react-native-paper";

interface BrandItemProps {
  active?: boolean;
  image?: string;
  menu?: boolean;
  onPress: () => void;
  showImage?: boolean;
  title: string;
}

const BrandItem: React.FC<BrandItemProps> = ({
  active,
  image,
  menu,
  onPress,
  showImage = false,
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
        <View
          style={{
            alignItems: "center",
            backgroundColor: Colors(theme).transparent,
            flexDirection: "row",
            gap: 10,
          }}
        >
          {
            showImage && (
              <Avatar.Image
                size={32}
                source={{
                  uri: image ?? "https://images.unsplash.com/photo-1557683316-973673baf926",
                }}
              />
            )
          }
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
        {
          menu && (
            <IconButton
              icon="dots-vertical"
              size={20}
              iconColor={active ? Colors(theme).white : Colors(theme).text}
            />
          )
        }
      </View>
    </Pressable>
  );
};

export default BrandItem;
