import AuthCard from "@/components/pre-signin/AuthCard";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The /pre-signin route. Shares the lets-start ambient canvas and floats the
 * auth card over it (dimmed), so arriving here reads as a modal over the same
 * page rather than a separate screen.
 */
const PreSigninScreen = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <>
            {/* <ExpoStatusBar style={!theme.dark ? "dark" : "light"} />
            <AppLayout withWebPadding={false}>
                <AmbientBackground> */}
            {/* <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: 24 + insets.top, paddingBottom: 24 + insets.bottom },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={ZoomIn.duration(220)} style={styles.cardWrap}> */}
            <AuthCard />
            {/* </Animated.View>
            </ScrollView> */}
            {/* </AmbientBackground>
            </AppLayout> */}
        </>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    cardWrap: {
        width: "100%",
        alignItems: "center",
    },
});

export default PreSigninScreen;
