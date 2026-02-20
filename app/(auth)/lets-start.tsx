import LetsStartMobile from "@/components/pre-signin/LetsStartMobile";
import LetsStartWeb from "@/components/pre-signin/LetsStartWeb";
import { useBreakpoints } from "@/hooks";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useMyNavigation } from "@/shared-libs/utils/router";
import React, { useEffect } from "react";
import { Platform } from "react-native";

const TrendlyScreen = () => {
    const { xl } = useBreakpoints()
    const { resetAndNavigate } = useMyNavigation()
    useEffect(() => {
        PersistentStorage.getItemWithExpiry("suppress_lets_start").then((value) => {
            if (value) {
                resetAndNavigate("/pre-signin");
            }
        })
    }, [])
    if (Platform.OS === 'web' && xl) {
        return <LetsStartWeb />
    }
    return <LetsStartMobile />
};

export default TrendlyScreen;