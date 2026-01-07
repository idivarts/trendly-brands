import Colors from "@/shared-uis/constants/Colors";
import { Theme } from "@react-navigation/native";
import { MD3Theme, DefaultTheme as PaperDefaultTheme } from "react-native-paper";

const CustomPaperTheme = (theme: Theme): MD3Theme => ({
    ...PaperDefaultTheme,
    colors: {
        ...PaperDefaultTheme.colors,
        primary: Colors(theme).primary, // Main brand color
        onPrimary: Colors(theme).white, // Text/icons on primary color

        secondary: Colors(theme).secondary, // Secondary brand color
        onSecondary: Colors(theme).white, // Text/icons on secondary color

        background: Colors(theme).background, // App background
        onBackground: Colors(theme).text, // Text/icons on background

        surface: Colors(theme).card, // Surface elements like cards
        onSurface: Colors(theme).text, // Text/icons on surface

        surfaceVariant: Colors(theme).background, // Variant of surface for sections
        onSurfaceVariant: Colors(theme).textSecondary, // Subtle text on variant surfaces

        // surfaceDisabled: Colors(theme).text, // Variant of surface for sections
        onSurfaceDisabled: Colors(theme).gray300, // Disabled text/icons on surface

        primaryContainer: Colors(theme).primary, // Container using primary background
        onPrimaryContainer: Colors(theme).white, // Text/icons on primary container

        secondaryContainer: Colors(theme).gray200, // Container using secondary background
        onSecondaryContainer: Colors(theme).text, // Text/icons on secondary container

        outline: Colors(theme).outline, // Borders and dividers

        error: "#B00020", // Standard error color
        onError: Colors(theme).white, // Text/icons on error

        elevation: {
            level0: "transparent",
            level1: Colors(theme).card, // Card elevation
            level2: Colors(theme).card,
            level3: Colors(theme).card,
            level4: Colors(theme).card,
            level5: Colors(theme).card,
        },
    },
});

export default CustomPaperTheme;
