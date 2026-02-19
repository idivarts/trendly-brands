import LetsStartMobile from "@/components/pre-signin/LetsStartMobile";
import LetsStartWeb from "@/components/pre-signin/LetsStartWeb";
import { useBreakpoints } from "@/hooks";
import React from "react";
import { Platform } from "react-native";

const TrendlyScreen = () => {
    const { xl } = useBreakpoints()
    if (Platform.OS === 'web' && xl) {
        return <LetsStartWeb />
    }
    return <LetsStartMobile />
};

export default TrendlyScreen;