import Colors from "@/constants/Colors";
import stylesFn from "@/styles/brand-item/BrandItem.styles";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Pressable, StyleSheet } from "react-native";
import { Text, View } from "../theme/Themed";

interface BrandActionItemProps {
  active?: boolean;
  icon?: IconProp;
  image?: any;
  onPress: () => void;
  showChevron?: boolean;
  title: string;
  removeTopBorder?: boolean
  removeBottomBorder?: boolean
}

const BrandActionItem: React.FC<BrandActionItemProps> = ({
  active,
  icon,
  onPress,
  showChevron = true,
  title,
  image = null,
  removeTopBorder,
  removeBottomBorder
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
            borderTopWidth: removeTopBorder ? 0 : StyleSheet.hairlineWidth,
            backgroundColor: active ? Colors(theme).primary : Colors(theme).background,
            borderBottomWidth: removeBottomBorder ? 0 : undefined,
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
          {image}
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
