import Colors from "@/shared-uis/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => StyleSheet.create({
    searchbar: {
        flex: 1,
        fontSize: 16,
        borderRadius: 10,
        height: 40,
        backgroundColor: Colors(theme).aliceBlue,
    },
    searchbarInput: {
        minHeight: 0,
    },
});

export default stylesFn;
