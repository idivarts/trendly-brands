import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Pressable, StyleProp, ViewStyle } from "react-native";

export type SelectItem = {
  label: string;
  value: string;
};

interface SelectProps {
  direction?: "row" | "column";
  items: SelectItem[];
  multiselect?: boolean;
  onSelect: (selectedItems: SelectItem[]) => void;
  selectItemIcon?: boolean;
  selectItemStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  value: SelectItem[] | [];
}

const Select: React.FC<SelectProps> = ({
  direction = "row",
  items,
  multiselect = false,
  onSelect,
  selectItemIcon = false,
  selectItemStyle,
  style,
  value,
}) => {
  const theme = useTheme();

  const handleSelect = (item: SelectItem) => {
    if (multiselect) {
      const index = value.findIndex(
        (selectedItem) => selectedItem.value === item.value,
      );
      if (index === -1) {
        onSelect([...value, item]);
      } else {
        onSelect([
          ...value.slice(0, index),
          ...value.slice(index + 1),
        ]);
      }
    } else {
      onSelect([item]);
    }
  };

  return (
    <View
      style={[
        {
          flex: 1,
          gap: 8,
        },
        direction === "row" ? {
          flexDirection: "row",
          flexWrap: "wrap",
        } : {
          flexDirection: "column",
          justifyContent: "center",
        },
        style,
      ]
      }
    >
      {
        items.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => handleSelect(item)}
          >
            <View
              key={item.value}
              style={[
                {
                  backgroundColor: value.find(
                    (selectedItem) => selectedItem.value === item.value,
                  )
                    ? Colors(theme).primary
                    : Colors(theme).tag,
                  borderRadius: 10,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 12,
                },
                selectItemStyle,
              ]}
            >
              <Text
                style={{
                  color: value.find(
                    (selectedItem) => selectedItem.value === item.value,
                  )
                    ? Colors(theme).white
                    : Colors(theme).text,
                }}
              >
                {item.label}
              </Text>
              {
                selectItemIcon && value.find(
                  (selectedItem) => selectedItem.value === item.value,
                ) && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    color={Colors(theme).white}
                  />
                )
              }
            </View>
          </Pressable>
        ))
      }
    </View>
  );
};

export default Select;
