import PreSignInMobile from "@/components/pre-signin/PreSigninMobile";
import PreSignInWeb from "@/components/pre-signin/PreSigninWeb";
import { useBreakpoints } from "@/hooks";
import React from "react";
import { Platform } from "react-native";

const PreSignIn = () => {
    const { xl } = useBreakpoints()
    if (Platform.OS === 'web' && xl) {
        return <PreSignInWeb />
    }
    return <PreSignInMobile />
};

export default PreSignIn;
