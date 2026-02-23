import { ColorsStatic } from "@/shared-uis/constants/Colors";
import React from "react";
import { StyleSheet, View } from "react-native";

const BACKGROUND_COLOR = ColorsStatic.white;

const GlassBackground = () => {
    return (
        <View style={styles.container} pointerEvents="none">
            <View style={styles.surface} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    surface: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: BACKGROUND_COLOR,
    },
});

export default GlassBackground;