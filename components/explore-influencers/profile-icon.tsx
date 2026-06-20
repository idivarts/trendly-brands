import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Image, StyleSheet } from "react-native";
import React, { useMemo } from "react";

import Colors from "@/shared-uis/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { imageUrl } from "@/utils/url";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { View } from "../theme/Themed";

const ProfileIcon = () => {
    const theme = useTheme();
    const { selectedBrand } = useBrandContext();
    const styles = useStyles();
    return (
        <View style={styles.wrapper}>
                <FontAwesomeIcon
                    color={Colors(theme).primary}
                    icon={faCircleNotch}
                    size={26}
                    style={styles.badgeIcon}
                />
                <Image
                    source={imageUrl(selectedBrand?.image)}
                    style={styles.avatar}
                />
            </View>
    );
};

function useStyles() {
    return StyleSheet.create({
        wrapper: {
            position: "relative",
            justifyContent: "center",
            alignItems: "center",
            // Match the 22px FontAwesome icons used by the other tabs so the
            // tab item height is consistent and the label aligns.
            width: 26,
            height: 26,
        },
        badgeIcon: {
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
        },
        avatar: {
            borderRadius: 100,
            height: 22,
            width: 22,
        },
    });
}

export default ProfileIcon;
