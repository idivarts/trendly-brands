import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

import { View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});

const Index = () => {
    const theme = useTheme();

    return (
        <View style={styles.center}>
            <ActivityIndicator
                size="large"
                color={Colors(theme).primary}
            />
        </View>
    );
};

export default Index;
