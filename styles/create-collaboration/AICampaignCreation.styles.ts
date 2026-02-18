import { Platform, StyleSheet } from "react-native";

const stylesFn = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.white,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: Platform.select({ web: 24, default: 16 }),
            paddingBottom: 40,
        },
        scrollContentWide: {
            maxWidth: 900,
            alignSelf: "center",
            width: "100%",
            paddingHorizontal: 40,
        },

        // Skip Button
        skipButton: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-end",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: colors.tag,
            gap: 6,
        },
        skipButtonPressed: {
            opacity: 0.7,
            backgroundColor: colors.outline,
        },
        skipButtonText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
        },

        // Header
        header: {
            marginTop: 32,
            marginBottom: 40,
        },
        iconContainer: {
            marginBottom: 20,
        },
        iconGradient: {
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
        },
        greeting: {
            fontSize: 16,
            color: colors.primary,
            fontWeight: "600",
            marginBottom: 8,
        },
        title: {
            fontSize: 32,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 12,
            lineHeight: 40,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            lineHeight: 24,
        },

        // Prompt Input
        promptContainer: {
            marginBottom: 32,
        },
        promptContainerWide: {
            maxWidth: 700,
        },
        inputWrapper: {
            backgroundColor: colors.background,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: colors.outline,
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            ...Platform.select({
                web: {
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                },
                default: {
                    elevation: 2,
                },
            }),
        },
        inputIcon: {
            marginTop: 4,
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: colors.text,
            minHeight: 80,
            maxHeight: 200,
            textAlignVertical: "top",
            ...Platform.select({
                web: {},
            }),
        },
        generateButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-end",
            ...Platform.select({
                web: {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                },
                default: {
                    elevation: 4,
                },
            }),
        },
        generateButtonDisabled: {
            backgroundColor: colors.outline,
            opacity: 0.6,
        },
        generateButtonPressed: {
            transform: [{ scale: 0.95 }],
        },

        // Quick Actions
        quickActionsContainer: {
            marginTop: 24,
        },
        quickActionsLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 12,
        },
        quickActions: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
        },
        quickActionButton: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 24,
            backgroundColor: colors.background,
            borderWidth: 1.5,
            borderColor: colors.outline,
            gap: 8,
        },
        quickActionButtonPressed: {
            backgroundColor: colors.tag,
            transform: [{ scale: 0.98 }],
        },
        quickActionButtonDisabled: {
            opacity: 0.5,
        },
        quickActionIcon: {
            marginTop: 1,
        },
        quickActionText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },

        // Footer
        footer: {
            marginTop: 40,
        },
        infoCard: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.background,
            padding: 16,
            borderRadius: 12,
            gap: 12,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
        },
        infoText: {
            flex: 1,
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
    });

export default stylesFn;
