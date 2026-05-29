import { Platform } from "react-native";

const RichTextEditor = Platform.select({
    native: () => require("./RichTextEditor.native").default,
    default: () => require("./RichTextEditor.web").default,
})();

export default RichTextEditor;
