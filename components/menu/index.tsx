import Colors from "@/constants/Colors";
import { MENU_ITEMS } from "@/constants/Menu";
import { useBrandContext } from "@/contexts/brand-context.provider";
import stylesFn from "@/styles/menu/MenuItem.styles";
import { truncateText } from "@/utils/text";
import { imageUrl } from "@/utils/url";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView } from "react-native";
import ProfileItemCard from "../ProfileItemCard";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";

const Menu = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const router = useRouter();

  const { selectedBrand } = useBrandContext();


  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
        }}
      >
        <View style={styles.menuItemsContainer}>
          <View style={styles.topRow}>
            <Image
              source={imageUrl(selectedBrand?.image)}
              style={styles.avatarBrandImage}
            />
            <Text style={styles.brandName}>{selectedBrand?.name}</Text>
            {selectedBrand?.profile?.about && (
              <Text
                style={{
                  fontSize: 16,
                  color: Colors(theme).gray100,
                }}
              >
                {truncateText(selectedBrand?.profile?.about, 120)}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Button
                mode="contained"
                style={styles.menuButton}
                onPress={() => {
                  router.push("/brand-profile");
                }}
              >
                Edit Brand
              </Button>
            </View>
          </View>
          <View style={styles.middleRow}>
            {MENU_ITEMS.map((item, index) => (
              <ProfileItemCard
                key={item.id}
                item={item}
                onPress={() => {
                  // @ts-ignore
                  router.push(item.href);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default Menu;
