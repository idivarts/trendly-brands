import Colors from "@/shared-uis/constants/Colors";
import { Theme } from "@react-navigation/native";
import { Platform } from "react-native";
import { configureFonts, MD3Theme, DefaultTheme as PaperDefaultTheme } from "react-native-paper";
import { MD3Type } from "react-native-paper/lib/typescript/types";

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
    // This applies the font to all variants (body, display, headline, etc.)
    fonts: configureFonts({ config: fontConfig }),
});
const fontConfig: Partial<MD3Type> = Platform.select({
    web: {
        fontFamily: 'Figtree, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"', // The name you used in useFonts
        fontWeight: "100"
    },
    default: {}
});

export default CustomPaperTheme;
