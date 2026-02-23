/**
 * Re-export from shared-uis so all app color usage comes from a single source.
 * Use useTheme() and Colors(theme) in components.
 */
import ColorsFromShared from "@/shared-uis/constants/Colors";
export { ColorsStatic } from "@/shared-uis/constants/Colors";
export default ColorsFromShared;
