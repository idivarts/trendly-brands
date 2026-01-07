import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const fnStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: Colors(theme).background,
        },
        headerContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
        },
        headline: {
            fontSize: 28,
            fontWeight: "bold",
            color: Colors(theme).text,
        },
        skipButtonLabel: {
            color: Colors(theme).text,
            fontSize: 16,
        },
        sectionHeader: {
            flexDirection: "row",
            alignItems: "center",
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: "600",
            color: Colors(theme).text,
        },
        checkboxContainer: {
            marginBottom: 20,
        },
        checkboxLabel: {
            color: Colors(theme).text,
        },
        bottomButtonContainer: {
            position: "absolute",
            bottom: 30,
            left: 20,
            right: 20,
        },
        submitButtonLabel: {
        },
        submitButtonContent: {
            height: 50,
        },
    });

export default fnStyles;
