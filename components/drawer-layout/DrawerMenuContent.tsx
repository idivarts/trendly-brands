import { Text, View } from "@/components/theme/Themed";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { APP_NAME } from "@/constants/App";
import DrawerMenuItem from "./DrawerMenuItem";
import { useBreakpoints } from "@/hooks";
import { BRANDS } from "@/constants/Brands";
import BrandItem from "./BrandItem";
import { useState } from "react";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";

interface DrawerMenuContentProps { }

const DRAWER_MENU_CONTENT_ITEMS = [
  {
    href: "/explore-influencers",
    label: "Explore Influencers",
  },
  {
    href: "/collaborations",
    label: "Collaborations",
  },
  {
    href: "/create-collaboration",
    label: "Create Collaboration",
  },
  {
    href: "/messages",
    label: "Messages",
  },
  {
    href: "/contracts",
    label: "Contracts",
  },
];

const DrawerMenuContent: React.FC<DrawerMenuContentProps> = () => {
  const { xl } = useBreakpoints();
  const [selectedBrand, setSelectedBrand] = useState<string>(BRANDS[0]);
  const navigation = useNavigation();

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    navigation.dispatch(DrawerActions.closeDrawer())
  };

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <DrawerContentScrollView>
        <View
          style={{
            flex: 1,
            gap: 6,
          }}
        >
          <View>
            <Text
              style={{
                paddingHorizontal: 24,
                paddingTop: 8,
                paddingBottom: 16,
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              {APP_NAME}
            </Text>
          </View>
          <View>
            {xl ? DRAWER_MENU_CONTENT_ITEMS.map((tab, index) => (
              <DrawerMenuItem
                key={index}
                tab={tab}
              />
            )) : BRANDS.map((brand) => (
              <BrandItem
                key={brand}
                onPress={() => handleBrandChange(brand)}
                title={brand}
                active={selectedBrand === brand}
              />
            ))}
          </View>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

export default DrawerMenuContent;
