import { Platform } from "react-native";

const Component = Platform.select({
    native: () => require("./StrategyEditorPanel.native").default,
    default: () => require("./StrategyEditorPanel.web").default,
})();

export default Component;
