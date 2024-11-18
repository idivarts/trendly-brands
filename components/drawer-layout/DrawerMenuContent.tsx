import { Text, View } from "@/components/theme/Themed";
import { APP_NAME } from "@/constants/App";
import DrawerMenuItem from "./DrawerMenuItem";
import { useBreakpoints } from "@/hooks";
import BrandItem from "./BrandItem";
import { DrawerActions, useTheme } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Brand } from "@/types/Brand";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, ScrollView } from "react-native";
import BrandActionItem from "./BrandActionItem";
import Colors from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Searchbar } from "react-native-paper";

interface DrawerMenuContentProps { }

const DRAWER_MENU_CONTENT_ITEMS = [
  {
    href: "/explore-influencers",
    icon: "handshake-o",
    label: "Explore Influencers",
  },
  {
    href: "/collaborations",
    icon: "group",
    label: "Collaborations",
  },
  {
    href: "/create-collaboration",
    icon: "plus-circle",
    label: "Create Collaboration",
  },
  {
    href: "/messages",
    icon: "comments",
    label: "Messages",
  },
  {
    href: "/contracts",
    icon: "file-text-o",
    label: "Contracts",
  },
];

const DrawerMenuContent: React.FC<DrawerMenuContentProps> = () => {
  const { xl } = useBreakpoints();
  const navigation = useNavigation();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const {
    brands,
    selectedBrand,
    setSelectedBrand,
  } = useBrandContext();

  const [filteredBrands, setFilteredBrands] = useState<Brand[]>(brands);
  const [search, setSearch] = useState("");

  const handleBrandChange = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  useEffect(() => {
    if (!search) {
      setFilteredBrands(brands);
      return;
    }

    setFilteredBrands(brands.filter(brand => brand.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, brands]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
  }

  return (
    <View
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'web' ? 12 : 64,
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
        {
          !xl && (
            <Searchbar
              onChangeText={handleSearchChange}
              placeholder="Search"
              placeholderTextColor={Colors(theme).gray100}
              value={search}
              style={[
                {
                  marginHorizontal: 14,
                  marginBottom: 8,
                  backgroundColor: Colors(theme).platinum
                },
              ]}
            />
          )
        }
      </View>
      <ScrollView
        style={{
          flex: 1,
          gap: 6,
        }}
      >
        <View>
          {xl ? DRAWER_MENU_CONTENT_ITEMS.map((tab, index) => (
            <DrawerMenuItem
              key={index}
              tab={tab}
            />
          )) : filteredBrands.map((brand) => (
            <BrandItem
              active={selectedBrand?.id === brand.id}
              image={brand.image}
              key={brand.id.toString()}
              menu={true}
              onPress={() => handleBrandChange(brand)}
              showImage={true}
              title={brand.name}
            />
          ))}
        </View>
      </ScrollView>
      <View
        style={{
          marginBottom: bottom + Platform.OS === 'android' ? 24 : 44,
        }}
      >
        <BrandActionItem
          key="create-brand"
          icon="plus"
          showChevron={false}
          onPress={() => {
            router.push("/(onboarding)/onboarding-your-brand");
            navigation.dispatch(DrawerActions.closeDrawer());
          }}
          title="Create New Brand"
        />
      </View>
    </View>
  );
};

export default DrawerMenuContent;
