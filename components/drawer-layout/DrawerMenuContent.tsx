import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import stylesFn from "@/styles/searchbar/Searchbar.styles";
import { Brand } from "@/types/Brand";
import {
  faComment,
  faFileLines,
  faHeart,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faComment as faCommentSolid,
  faHeart as faHeartSolid,
  faMagnifyingGlass,
  faPlus,
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { DrawerActions, Theme, useTheme } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet } from "react-native";
import { Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileIcon from "../explore-influencers/profile-icon";
import BrandSwitcher, { OpenBrandSwitcher } from "../ui/brand-switcher";
import BrandActionItem from "./BrandActionItem";
import BrandItem from "./BrandItem";
import DrawerIcon from "./DrawerIcon";
import DrawerMenuItem, { IconPropFn } from "./DrawerMenuItem";

interface DrawerMenuContentProps { }

const DRAWER_MENU_CONTENT_ITEMS = (theme: Theme) => [
  {
    href: "/explore-influencers",
    icon: ({ focused }: IconPropFn) =>
      focused ? (
        <DrawerIcon href="/explore-influencers" icon={faHeartSolid} />
      ) : (
        <DrawerIcon href="/explore-influencers" icon={faHeart} />
      ),
    label: "Explore",
  },
  {
    href: "/collaborations",
    icon: ({ focused }: IconPropFn) =>
      focused ? (
        <DrawerIcon href="/collaborations" icon={faStarSolid} />
      ) : (
        <DrawerIcon href="/collaborations" icon={faStar} />
      ),
    label: "Collaborations",
  },
  {
    href: "/messages",
    icon: ({ focused }: IconPropFn) =>
      focused ? (
        <DrawerIcon href="/messages" icon={faCommentSolid} />
      ) : (
        <DrawerIcon href="/messages" icon={faComment} />
      ),
    label: "Messages",
  },
  {
    href: "/contracts",
    icon: () => <DrawerIcon href="/contracts" icon={faFileLines} />,
    label: "Contracts",
  },
  {
    href: "/menu",
    icon: ({ focused }: IconPropFn) => <ProfileIcon />,
    label: "My Brand",
  },
];

const DrawerMenuContent: React.FC<DrawerMenuContentProps> = () => {
  const { xl } = useBreakpoints();
  const navigation = useNavigation();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const styles = stylesFn(theme);
  const { brands, selectedBrand, setSelectedBrand } = useBrandContext();

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

    setFilteredBrands(
      brands.filter((brand) =>
        brand.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, brands]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: Platform.OS === "web" ? 8 : 64,
        backgroundColor: Colors(theme).background,
      }}
    >
      {/* Header Section */}
      <View
        style={{
          paddingHorizontal: 8,
          paddingBottom: 12,
          borderBottomColor: Colors(theme).border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Pressable onPress={() => {
          OpenBrandSwitcher.next(undefined)
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                paddingVertical: 10,
                paddingHorizontal: 16,
                flex: 1,
                color: Colors(theme).text,
              }}
            >
              {selectedBrand?.name ?? "Brand"}
            </Text>
            {xl && <BrandSwitcher />}
          </View>
        </Pressable>


        {!xl && (
          <View style={{ marginTop: 8 }}>
            <Searchbar
              icon={() => (
                <FontAwesomeIcon
                  color={Colors(theme).gray100}
                  icon={faMagnifyingGlass}
                  size={18}
                />
              )}
              iconColor={Colors(theme).gray100}
              inputStyle={styles.searchbarInput}
              onChangeText={handleSearchChange}
              placeholder="Search Brands"
              placeholderTextColor={Colors(theme).gray100}
              style={[
                styles.searchbar,
                {
                  backgroundColor: Colors(theme).card,
                  borderRadius: 12,
                  marginBottom: 4,
                },
              ]}
              value={search}
            />
          </View>
        )}
      </View>

      {/* Scrollable Menu Section */}
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 12,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {xl
          ? DRAWER_MENU_CONTENT_ITEMS(theme).map((tab, index) => (
            <DrawerMenuItem key={index} tab={tab} />
          ))
          : filteredBrands.map((brand) => (
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
      </ScrollView>

      {/* Bottom CTA Section */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: bottom + (Platform.OS === "android" ? 24 : 36),
          borderTopColor: Colors(theme).border,
          borderTopWidth: StyleSheet.hairlineWidth,
        }}
      >
        <BrandActionItem
          key="create-brand"
          icon={faPlus}
          showChevron={false}
          onPress={() => {
            router.push({
              pathname: "/onboarding-your-brand",
            });
            navigation.dispatch(DrawerActions.closeDrawer());
          }}
          title="Create New Brand"
          removeBottomBorder={true}
        />
      </View>
    </View>
  );
};
export default DrawerMenuContent;