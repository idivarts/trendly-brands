import { Text, View } from "@/components/theme/Themed";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { APP_NAME } from "@/constants/App";
import DrawerMenuItem from "./DrawerMenuItem";
import { useBreakpoints } from "@/hooks";
import BrandItem from "./BrandItem";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Brand } from "@/types/Brand";

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
  const navigation = useNavigation();

  const {
    brands,
    selectedBrand,
    setSelectedBrand,
  } = useBrandContext();

  const handleBrandChange = (brand: Brand) => {
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
            )) : brands.map((brand) => (
              <BrandItem
                key={brand.id.toString()}
                onPress={() => handleBrandChange(brand)}
                title={brand.name}
                active={selectedBrand?.id === brand.id}
              />
            ))}
          </View>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

export default DrawerMenuContent;
