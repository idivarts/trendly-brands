import Colors from "@/shared-uis/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => {
    const colors = Colors(theme);
    return StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    contentContainer: {
        paddingVertical: 16,
        flexGrow: 1,
    },
    modalContainer: {
        position: 'relative',
        backgroundColor: colors.background,
        zIndex: 100,
        padding: 20,
        gap: 16,
        margin: 16,
        borderRadius: 8,
    },
    sectionTitle: { fontSize: 16 },
    mainSection: { flexGrow: 1, gap: 16 },
    section: { gap: 16 },
    sectionGap8: { gap: 8 },
    addLinkIcon: { marginTop: -2, marginRight: 8 },
    linkItem: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        padding: 8,
        borderColor: colors.text,
        borderWidth: 1,
        borderRadius: 10,
    },
    linkText: { textDecorationLine: "underline" as const, flex: 1 },
    questionRow: { alignItems: "center" as const, flexDirection: "row" as const, gap: 8 },
    helperText: { color: colors.primary, textAlign: "center" as const },
    progressBar: { backgroundColor: colors.transparent },
    modalButtonsRow: { flexDirection: "row" as const, gap: 8 },
    modalButtonFlex: { flex: 1 },
    pressableDismiss: {
        position: "absolute",
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
    },
    questionsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
    },
    questionsTitle: { fontSize: 16, fontWeight: "bold" as const },
    questionsScroll: { maxHeight: 180 },
    questionsScrollContent: { gap: 8 },
    questionInputRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 16 },
    questionInputFlex: { flex: 1 },
    trashIconMargin: { marginTop: 4 },
    });
};

export default stylesFn;
