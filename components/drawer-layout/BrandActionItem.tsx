import { useTheme } from "@react-navigation/native";
import { Pressable, StyleSheet } from "react-native";
import { Text, View } from "../theme/Themed";
import Colors from "@/constants/Colors";
import stylesFn from "@/styles/brand-item/BrandItem.styles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface BrandActionItemProps {
  active?: boolean;
  icon?: IconProp;
  onPress: () => void;
  showChevron?: boolean;
  title: string;
}

const BrandActionItem: React.FC<BrandActionItemProps> = ({
  active,
  icon,
  onPress,
  showChevron = true,
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
            borderTopColor: Colors(theme).aliceBlue,
            borderTopWidth: StyleSheet.hairlineWidth,
            backgroundColor: active ? Colors(theme).primary : Colors(theme).background,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            backgroundColor: Colors(theme).transparent,
          }}
        >
          {
            icon && (
              <FontAwesomeIcon
                color={Colors(theme).text}
                icon={icon}
                size={18}
                style={{
                  marginRight: 6,
                  backgroundColor: Colors(theme).transparent,
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
          showChevron && (
            <FontAwesomeIcon
              color={active ? Colors(theme).white : Colors(theme).text}
              icon={faChevronRight}
              size={16}
            />
          )
        }
      </View>
    </Pressable>
  );
};

export default BrandActionItem;
