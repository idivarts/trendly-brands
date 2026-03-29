import Colors from "@/shared-uis/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (
    theme: Theme,
    layout?: { xl: boolean; width: number },
) => {
    const colors = Colors(theme);
    const modalMaxWidth =
        layout && layout.width > 0
            ? Math.min(600, Math.max(280, layout.width - 32))
            : undefined;

    return StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    contentContainer: {
        paddingVertical: 16,
        flexGrow: 1,
    },
    modalRoot: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        position: "relative",
        backgroundColor: colors.background,
        zIndex: 100,
        padding: 20,
        gap: 16,
        margin: 16,
        borderRadius: 8,
        ...(modalMaxWidth !== undefined
            ? {
                  maxWidth: modalMaxWidth,
                  width: "100%",
                  alignSelf: "center",
              }
            : {}),
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
    questionListItem: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        padding: 8,
        borderColor: colors.text,
        borderWidth: 1,
        borderRadius: 10,
    },
    questionListText: { flex: 1 },
    questionListActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    questionModalTitle: { fontSize: 18, fontWeight: "700" as const },
    helperText: { color: colors.primary, textAlign: "center" as const },
    progressBar: { backgroundColor: colors.transparent },
    modalButtonsRow: { flexDirection: "row" as const, gap: 8 },
    modalButtonFlex: { flex: 1 },
    linkUrlFieldGroup: {
        gap: 0,
    },
    linkUrlErrorHelper: {
        paddingHorizontal: 0,
    },
    });
};

export default stylesFn;
