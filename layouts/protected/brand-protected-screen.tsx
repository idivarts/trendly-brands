import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { ActivityIndicator, Platform } from "react-native";

import ExploreInfluencerShimmer from "@/components/shimmers/explore-influencer-shimmer";
import { View } from "@/components/theme/Themed";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import Colors from "@/shared-uis/constants/Colors";

interface BrandProtectedScreenProps extends PropsWithChildren { }

const BrandProtectedScreen: React.FC<BrandProtectedScreenProps> = ({
    children,
}) => {
    // const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { selectedBrand, loading } = useBrandContext()
    const [key, setKey] = useState(0);
    useEffect(() => {
        Console.log("Brand Selected", loading, selectedBrand);
        if (!loading && !selectedBrand) {
            //   // If the manager has no brands, redirect to onboarding
            router.replace({
                pathname: "/onboarding-your-brand",
                params: {
                    firstBrand: "true",
                },
            });
        }
        if (!loading && selectedBrand?.id) {
            setKey(key + 1);
        }
    }, [selectedBrand?.id, loading])


    return <>
        {loading && <LoadingScreen />}
        <View key={key} style={{ flex: 1, display: loading ? "none" : "flex" }}>
            {children}
        </View>
    </>;
};

const LoadingScreen: React.FC = () => {
    const theme = useTheme();

    if (Platform.OS === "web") {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator
                    size="large"
                    color={Colors(theme).primary}
                />
            </View>
        );
    }

    return (
        <ExploreInfluencerShimmer />
    );
}

export default BrandProtectedScreen;
