import Colors from "@/shared-uis/constants/Colors";
import { MENU_ITEMS } from "@/constants/Menu";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { truncateText } from "@/utils/text";
import { imageUrl } from "@/utils/url";
import { useTheme, type Theme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, ScrollView, StyleSheet } from "react-native";
import ProfileItemCard from "../ProfileItemCard";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";

const Menu = () => {
    const theme = useTheme();
    const styles = useMemo(() => useMenuItemStyles(theme), [theme]);
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
}

function useMenuItemStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        backgroundImage: {
            width: "100%",
            height: 100,
        },
        brandAvatar: {
            bottom: 36,
            marginBottom: -72,
            left: 20,
            zIndex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors(theme).primary,
        },
        brandName: {
            fontSize: 24,
            textAlign: "center",
            color: Colors(theme).text,
        },
        menuItemsContainer: {
            flex: 1,
            paddingHorizontal: 20,
            paddingVertical: 10,
            gap: 16,
            justifyContent: "space-between",
        },
        topRow: {
            gap: 20,
            alignItems: "center",
            paddingTop: 20,
        },
        middleRow: {
            flex: 1,
        },
        bottomRow: {
            gap: 14,
        },
        menuRow: {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: Colors(theme).aliceBlue,
            paddingVertical: 14,
        },
        menuRowText: {
            fontSize: 16,
        },
        userProfileContainer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
        },
        avatar: {
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors(theme).primary,
        },
        avatarBrandImage: {
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors(theme).primary,
            width: 200,
            height: 200,
            borderRadius: 20,
        },
        textContainer: {
            flex: 1,
        },
        titleText: {
            fontSize: 16,
        },
        chevron: {
            backgroundColor: Colors(theme).background,
            color: Colors(theme).primary,
        },
        menuButton: {
            backgroundColor: Colors(theme).primary,
        },
    });
}

export default Menu;
