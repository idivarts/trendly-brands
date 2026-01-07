import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 16,
        },
        contentContainer: {
            paddingVertical: 16,
        },
        title: {},
        input: {
            marginBottom: 16,
            backgroundColor: Colors(theme).background,
        },
        budgetContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
        },
        budgetInput: {
            width: "48%",
            backgroundColor: Colors(theme).background,
        },
        paragraph: {
            marginVertical: 8,
        },
        counter: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
        },
    });
