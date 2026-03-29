import Colors from "@/shared-uis/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) => {
    const colors = Colors(theme);
    return StyleSheet.create({
        scrollContainer: {
            gap: 16,
            paddingBottom: 24,
        },
        profileCard: {
            backgroundColor: colors.card,
            borderRadius: 10,
            gap: 16,
            shadowColor: colors.transparent,
            paddingTop: 20,
        },
        profileCardCenter: {
            alignItems: "center",
        },
        profileImage: {
            height: 160,
            marginBottom: 10,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
        },
        profileContent: {
            alignItems: "center",
            width: "100%",
            gap: 16,
            paddingBottom: 20,
        },
        contentColumn: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
        },
        contentRow: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            gap: 8,
            alignItems: "center",
        },
        timestamp: {
            fontSize: 12,
            color: colors.text,
            paddingRight: 8,
        },
        contentFullWidth: { width: "100%" },
        ratingCard: {
            width: "100%",
            borderWidth: 0.3,
            paddingVertical: 16,
            borderRadius: 10,
            borderColor: colors.gray300,
        },
        ratingInner: {
            flex: 1,
            flexDirection: "column",
            gap: 16,
        },
        brandRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexGrow: 1,
        },
        brandLogo: {
            width: 40,
            height: 40,
            borderRadius: 5,
        },
        brandTextCol: { flex: 1 },
        name: {
            fontWeight: "bold",
            fontSize: 20,
            color: colors.text,
            lineHeight: 20,
            flex: 1,
        },
        brandName: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        brandDescription: {
            fontSize: 16,
            flexWrap: "wrap",
            overflow: "hidden",
            color: colors.text,
            lineHeight: 22,
        },
        shortDescription: {
            fontSize: 14,
            color: colors.text,
            lineHeight: 22,
            textAlign: "left",
            marginTop: 8,
        },
        linksRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "space-between",
        },
        linkButton: {
            flexBasis: 1,
            flexGrow: 1,
            borderColor: colors.primary,
            borderWidth: 0.3,
        },
        statsCard: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 8,
            borderWidth: 0.3,
            borderRadius: 10,
            padding: 16,
        },
        statsText: {
            fontSize: 16,
            color: colors.text,
        },
        chipsRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            width: "100%",
            rowGap: 10,
        },
        locationHeading: {
            fontSize: 16,
            color: colors.text,
            fontWeight: "bold",
            marginBottom: 16,
        },
        locationText: {
            fontSize: 16,
            color: colors.text,
        },
        questionsCard: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 8,
            borderWidth: 0.3,
            borderRadius: 10,
            padding: 16,
        },
        questionsTitle: {
            fontSize: 16,
            color: colors.text,
            fontWeight: "bold",
        },
        postedBySection: {
            width: "100%",
            gap: 16,
        },
        postedByTitle: {
            fontSize: 16,
            color: colors.text,
            fontWeight: "bold",
        },
        managerRow: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        managerCol: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
        },
        managerName: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        managerRole: {
            fontSize: 16,
            color: colors.gray100,
        },
        managerAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
        },
        statsContainer: {
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 12,
            flexWrap: "wrap",
            gap: 8,
        },
        applyButton: {
            marginVertical: 16,
            width: "100%",
        },
        infoCard: {
            backgroundColor: colors.card,
            borderRadius: 10,
            shadowColor: colors.transparent,
        },
        cardName: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
            margin: 16,
        },
        paragraph: {
            color: colors.text,
        },
    });
};
