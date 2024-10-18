import { BRANDS } from "@/constants/Brands";
import Colors from "@/constants/Colors";
import { Octicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Pressable } from "react-native";
import { Menu } from "react-native-paper";

const BrandSwitcher = () => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const [selectedBrand, setSelectedBrand] = useState<string>(BRANDS[0]);

  const openMenu = () => setVisible(true);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setVisible(false);
  }

  return (
    <Menu
      visible={visible}
      anchorPosition="top"
      onDismiss={() => setVisible(false)}
      anchor={
        <Pressable onPress={openMenu}>
          <Octicons
            name="arrow-switch"
            size={26}
            style={{
              marginLeft: 14,
              color: Colors(theme).text,
              marginBottom: -2,
            }}
          />
        </Pressable>
      }
    >
      {
        BRANDS.map((brand) => (
          <Menu.Item
            key={brand}
            style={{
              backgroundColor: brand === selectedBrand ? Colors(theme).primary : Colors(theme).background,
            }}
            onPress={() => handleBrandChange(brand)}
            title={brand}
          />
        ))
      }
    </Menu>
  );
};

export default BrandSwitcher;
