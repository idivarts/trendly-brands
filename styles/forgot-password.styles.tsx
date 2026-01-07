import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const fnStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: "center",
            padding: 20,
            backgroundColor: Colors(theme).background,
        },
        logo: {
            alignSelf: "center",
            width: 100,
            height: 100,
            marginBottom: 30,
        },
        title: {
            textAlign: "center",
            fontSize: 22,
            fontWeight: "600",
            marginBottom: 30,
            color: Colors(theme).text,
        },
        input: {
            marginBottom: 20,
            backgroundColor: Colors(theme).background,
        },
        button: {
            marginTop: 20,
            paddingVertical: 10,
            borderRadius: 8,
        },
        buttonText: {
            fontWeight: "bold",
            fontSize: 16,
        },
        loginText: {
            textAlign: "center",
            marginTop: 20,
            color: Colors(theme).text,
        },
        loginLink: {
            color: Colors(theme).primary,
            fontWeight: "bold",
        },
    });

export default fnStyles;
