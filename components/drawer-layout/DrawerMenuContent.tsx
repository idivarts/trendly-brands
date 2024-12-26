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
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faComment as faCommentSolid,
  faGears,
  faHouseUser as faHouseUserSolid,
  faMagnifyingGlass,
  faPlus,
  faPlusCircle,
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import stylesFn from "@/styles/searchbar/Searchbar.styles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import DrawerIcon from "./DrawerIcon";
import HomeIcon from "@/assets/icons/home.svg";

interface DrawerMenuContentProps { }

const DRAWER_MENU_CONTENT_ITEMS = (
  theme: Theme,
) => [
    {
      href: "/explore-influencers",
      icon: ({
        focused,
      }: IconPropFn) => focused ? (
        <DrawerIcon
          href="/explore-influencers"
          icon={faHouseUserSolid}
        />
      ) : (
          <HomeIcon
            width={28}
            height={28}
            fill={Colors(theme).text}
          />
        ),
      label: "Home",
    },
    {
      href: "/collaborations",
      icon: ({
        focused,
      }: IconPropFn) => focused ? (
        <DrawerIcon
          href="/collaborations"
          icon={faStarSolid}
        />
      ) : (
          <DrawerIcon
            href="/collaborations"
            icon={faStar}
          />
        ),
      label: "Collaborations",
    },
    {
      href: "/create-collaboration",
      icon: () => (
        <DrawerIcon
          href="/create-collaboration"
          icon={faPlusCircle}
        />
      ),
      label: "Create Collaboration",
    },
    {
      href: "/messages",
      icon: ({
        focused,
      }: IconPropFn) => focused ? (
        <DrawerIcon
          href="/messages"
          icon={faCommentSolid}
        />
      ) : (
          <DrawerIcon
            href="/messages"
            icon={faComment}
          />
        ),
      label: "Messages",
    },
    {
      href: "/menu",
      icon: ({
        focused,
      }: IconPropFn) => focused ? (
        <DrawerIcon
          href="/menu"
          icon={faGears}
        />
      ) : (
          <DrawerIcon
            href="/menu"
            icon={faGears}
          />
        ),
      label: "Settings",
    },
  ];

const DrawerMenuContent: React.FC<DrawerMenuContentProps> = () => {
  const { xl } = useBreakpoints();
  const navigation = useNavigation();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const styles = stylesFn(theme);
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
            <View
              style={{
                flexDirection: 'row',
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
          )
        }
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
          {xl ? DRAWER_MENU_CONTENT_ITEMS(theme).map((tab, index) => (
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
          icon={faPlus}
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
