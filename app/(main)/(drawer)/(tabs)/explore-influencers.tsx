import ExploreInfluencers from "@/components/explore-influencers";
import RightPanel from "@/components/explore-influencers/RightPanel";
import FullInformationalIllustration from "@/components/FullScreenIllustration";
import NotificationIcon from "@/components/notifications/notification-icon";
import PageHeader from "@/components/ui/page-header";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";

const styles = StyleSheet.create({
    xlContainer: {
        width: "100%",
        flexDirection: "row",
        gap: 24,
        height: "100%",
    },
    main: {
        flex: 1,
        minWidth: 0,
    },
    rightPanel: {
        width: 350,
    },
});

const ExploreInfluencersScreen = () => {
    const { manager } = useAuthContext()
    const { selectedBrand } = useBrandContext()
    const preferences = selectedBrand?.preferences
    const [connectedInfluencer, setConnectedInfluencer] = useState(false)

    const { xl } = useBreakpoints()

    const [fullIllustration, setFullIllustration] = useState(true)
    useEffect(() => {
        if (!selectedBrand)
            return;
        (async () => {
            const x = await PersistentStorage.get(selectedBrand.id + "-explore")
            setFullIllustration(!x)
        })()
    }, [selectedBrand])

    if (fullIllustration)
        return <FullInformationalIllustration action={() => {
            PersistentStorage.set(selectedBrand?.id + "-explore", "true")
            setFullIllustration(false)
        }} config={{
            kicker: "Our Micro Creators",
            title: "Spotlighting {Trendly's Verified} Influencers!",
            description: "Discover influencers already vetted and verified on Trendly. Get instant access to trusted creators ready to collaborate with your brand.",
            action: "Explore Spotlights",
            image: "https://d1tfun8qrz04mk.cloudfront.net/uploads/file_1758395180_images-1758395179311-influencer spotlight walkthrough.jpg"
        }} videoUrl="https://www.youtube.com/embed/xwMq0tDKF98?si=8r0V2xKABRfnZlBN" />

    if (!manager && !preferences)
        return <ActivityIndicator />

    const pageHeader = (
        <PageHeader
            title="Influencer Spotlights"
            subtitle="Discover featured creators"
            rightComponent={<NotificationIcon />}
            mobileActions="notification-only"
        />
    );

    if (xl) {
        return (
            <View style={{ flex: 1 }}>
                {pageHeader}
                <View style={styles.xlContainer}>
                    <View style={styles.main}>
                        <ExploreInfluencers key={connectedInfluencer ? "connected" : "explore"} connectedInfluencers={connectedInfluencer} />
                    </View>
                    <View style={styles.rightPanel} >
                        <RightPanel connectedInfluencers={connectedInfluencer} setConnectedInfluencers={setConnectedInfluencer} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {pageHeader}
            <ExploreInfluencers />
        </View>
    );
};

export default ExploreInfluencersScreen;
