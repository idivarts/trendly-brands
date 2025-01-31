import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Brand } from "@/types/Brand";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Pressable } from "react-native";
import { Menu } from "react-native-paper";

const BrandSwitcher = () => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  const { brands, selectedBrand, setSelectedBrand } = useBrandContext();

  const openMenu = () => setVisible(true);

  const handleBrandChange = (brand: Brand) => {
    setSelectedBrand(brand);
    setVisible(false);
  };

  return (
    <Menu
      visible={visible}
      anchorPosition="top"
      onDismiss={() => setVisible(false)}
      contentStyle={{
        paddingVertical: 0,
        borderRadius: 4,
        overflow: "hidden",
      }}
      anchor={
        <Pressable onPress={openMenu}>
          <FontAwesomeIcon
            color={Colors(theme).text}
            icon={faChevronDown}
            size={16}
            style={{
              marginLeft: 14,
              color: Colors(theme).text,
              marginBottom: -2,
            }}
          />
        </Pressable>
      }
    >
      {brands.map((brand) => (
        <Menu.Item
          key={brand.id}
          style={{
            backgroundColor:
              brand.id === selectedBrand?.id
                ? Colors(theme).primary
                : Colors(theme).background,
            margin: 0,
          }}
          titleStyle={{
            color:
              brand.id === selectedBrand?.id
                ? Colors(theme).white
                : Colors(theme).text,
            fontSize: 16,
          }}
          onPress={() => handleBrandChange(brand)}
          title={brand.name}
        />
      ))}
    </Menu>
  );
};

export default BrandSwitcher;
