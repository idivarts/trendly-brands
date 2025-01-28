import { Text, View } from "@/components/theme/Themed";
import { APP_NAME } from "@/constants/App";
import DrawerMenuItem, { IconPropFn } from "./DrawerMenuItem";
import { useBreakpoints } from "@/hooks";
import BrandItem from "./BrandItem";
import { DrawerActions, Theme, useTheme } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Brand } from "@/types/Brand";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, ScrollView } from "react-native";
import BrandActionItem from "./BrandActionItem";
import Colors from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Searchbar } from "react-native-paper";
import {
  faComment,
  faFileLines,
  faHeart,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faComment as faCommentSolid,
  faBuilding,
  faHeart as faHeartSolid,
  faMagnifyingGlass,
  faPlus,
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import stylesFn from "@/styles/searchbar/Searchbar.styles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import DrawerIcon from "./DrawerIcon";
import HomeIcon from "@/assets/icons/home.svg";
import BrandSwitcher from "../ui/brand-switcher";

interface DrawerMenuContentProps { }

const DRAWER_MENU_CONTENT_ITEMS = (theme: Theme) => [
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
    href: "/menu",
    icon: ({ focused }: IconPropFn) =>
      focused ? (
        <DrawerIcon href="/menu" icon={faBuilding} />
      ) : (
        <DrawerIcon href="/menu" icon={faBuilding} />
      ),
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
        paddingTop: Platform.OS === "web" ? 12 : 64,
      }}
    >
      <View>
        {xl ? (
          <Text
            style={{
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 16,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            {selectedBrand?.name ?? "Brand"}

            <BrandSwitcher />
          </Text>
        ) : (
          <Text
            style={{
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 16,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            {selectedBrand?.name ?? "Brand"}
          </Text>
        )}
        {!xl && (
          <View
            style={{
              flexDirection: "row",
            }}
          >
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
              placeholder="Search"
              placeholderTextColor={Colors(theme).gray100}
              style={[
                styles.searchbar,
                {
                  marginHorizontal: 14,
                  marginBottom: 8,
                },
              ]}
              value={search}
            />
          </View>
        )}
      </View>
      <ScrollView
        style={{
          flex: 1,
          gap: 6,
        }}
      >
        <View
          style={{
            paddingTop: 8,
          }}
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
        </View>
      </ScrollView>
      <View
        style={{
          marginBottom: bottom + Platform.OS === "android" ? 24 : 44,
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
        />
      </View>
    </View>
  );
};

export default DrawerMenuContent;
