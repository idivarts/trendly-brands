import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Pressable } from "react-native";

export type SelectItem = {
  label: string;
  value: string;
};

interface SelectProps {
  items: SelectItem[];
  multiselect?: boolean;
  onSelect: (selectedItems: SelectItem[]) => void;
  value: SelectItem[] | [];
}

const Select: React.FC<SelectProps> = ({
  items,
  multiselect = false,
  onSelect,
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
      style={{
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {
        items.map((item) => (
          <Pressable
            onPress={() => handleSelect(item)}
          >
            <View
              key={item.value}
              style={{
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
              }}
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
            </View>
          </Pressable>
        ))
      }
    </View>
  );
};

export default Select;
