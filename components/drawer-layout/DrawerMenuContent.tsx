import { useBreakpoints } from "@/hooks";
import React from "react";
import DrawerMenuContentWeb from "./DrawerMenuContentWeb";

interface DrawerMenuContentProps { }

const DrawerMenuContent: React.FC<DrawerMenuContentProps> = () => {
    const { xl } = useBreakpoints();

    if (xl) {
        return <DrawerMenuContentWeb />;
    }

    // At sub-xl breakpoints the native swipe drawer is used — no web sidebar needed.
    return null;
};

export default DrawerMenuContent;
