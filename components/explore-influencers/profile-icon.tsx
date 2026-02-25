import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet } from "react-native";
import React, { useMemo } from "react";

import Colors from "@/shared-uis/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { imageUrl } from "@/utils/url";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { View } from "../theme/Themed";

const ProfileIcon = () => {
    const theme = useTheme();
    const {
        selectedBrand,
    } = useBrandContext();
    const router = useRouter();
    const styles = useMemo(() => useStyles(), []);
    return (
        <Pressable onPress={() => router.push("/menu")}>
            <View style={styles.wrapper}>
                <FontAwesomeIcon
                    color={Colors(theme).primary}
                    icon={faCircleNotch}
                    size={32}
                    style={styles.badgeIcon}
                />
                <Image
                    source={imageUrl(selectedBrand?.image)}
                    style={styles.avatar}
                />
            </View>
        </Pressable>
    )
};

function useStyles() {
    return StyleSheet.create({
        wrapper: {
            position: "relative",
            justifyContent: "center",
            alignItems: "center",
        },
        badgeIcon: {
            left: -2,
            position: "absolute",
            top: -2,
            zIndex: 1,
        },
        avatar: {
            borderRadius: 100,
            height: 28,
            width: 28,
        },
    });
}

export default ProfileIcon;
