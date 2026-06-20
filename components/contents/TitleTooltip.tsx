import React from "react";
import { Platform } from "react-native";

/**
 * On web, surface the full (possibly truncated) title as a native browser
 * tooltip via the HTML `title` attribute. RN-web strips `title` from View/Text,
 * so we wrap in a real element here. No-op on native, where hover doesn't exist.
 */
const TitleTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({
    text,
    children,
}) =>
    Platform.OS === "web"
        ? React.createElement(
              "div",
              { title: text, style: { display: "flex", flexDirection: "column", minWidth: 0 } },
              children
          )
        : (children as React.ReactElement);

export default TitleTooltip;
