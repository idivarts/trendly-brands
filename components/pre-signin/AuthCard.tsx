import AuthHeader from "@/components/auth/AuthHeader";
import AuthOptions from "@/components/pre-signin/AuthOptions";
import React from "react";
import { StyleSheet, View } from "react-native";

const TITLE = "Get Started with Trendly";
const SUBTITLE = "Plan, create, and manage your brand's social content in one calm space.";

/**
 * The auth surface (title + subtitle + provider buttons). Rendered on the
 * /pre-signin route and as the in-page card on the lets-start AI page. Uses the
 * shared AuthHeader so it matches the email auth screens exactly.
 */
const AuthCard: React.FC = () => {
    return (
        <View style={styles.container}>
            <AuthHeader title={TITLE} subtitle={SUBTITLE} />
            <AuthOptions />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
});

export default AuthCard;
