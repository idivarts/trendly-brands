import DiscoverInfluencer from "@/components/discover/DiscoverInfluencer";
import RightPanelDiscover, { DB_TYPE } from "@/components/discover/RightPanelDiscover";
import FullInformationalIllustration from "@/components/FullScreenIllustration";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { Subject } from "rxjs";

export const OpenFilterRightPanel = new Subject()

interface DiscoveryProps {
    selectedDb: DB_TYPE,
    setSelectedDb: Function
    rightPanel: boolean,
    setRightPanel: Function
    showFilters: boolean
    setShowFilters: Function
}
const DiscoveryContext = createContext<DiscoveryProps>({} as DiscoveryProps)
export const useDiscovery = () => useContext(DiscoveryContext)

const DiscoverInfluencersScreen = () => {
    const { manager } = useAuthContext()
    const { selectedBrand } = useBrandContext()
    const [rightPanel, setRightPanel] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    const { xl } = useBreakpoints()

    const [selectedDb, setSelectedDb] = useState<DB_TYPE>("trendly")

    useEffect(() => {
        const unsubs = OpenFilterRightPanel.subscribe(() => {
            setRightPanel(true)
        })
        return () => unsubs.unsubscribe()
    }, [])

    const [fullIllustration, setFullIllustration] = useState(true)
    useEffect(() => {
        if (!selectedBrand)
            return;
        (async () => {
            const x = await PersistentStorage.get(selectedBrand.id + "-discover")
            setFullIllustration(!x)
        })()
    }, [selectedBrand])

    if (fullIllustration)
        return <FullInformationalIllustration action={() => {
            PersistentStorage.set(selectedBrand?.id + "-discover", "true")
            setFullIllustration(false)
        }} config={{
            title: "{Advanced Filtering} of Public Instagram Profiles",
            description: "This will help you to find influencers that are already registered on trendly and hence verified from our end. This poses the least risk as we have strong control over these influencers",
            action: "Discover Now",
            items: [
                "Micro Influencers (under 100k followers)",
                "Trustablity and Budget Estimation",
                "Know the estimated views beforehand"
            ],
        }} videoUrl="https://www.youtube.com/embed/oqYLHTnszIg?si=NTYuarzgkbLEPhTO" />

    if (!manager || !selectedBrand || !selectedBrand.id)
        return <ActivityIndicator />

    return (
        <DiscoveryContext.Provider value={{
            selectedDb,
            setSelectedDb,
            rightPanel,
            setRightPanel,
            showFilters, setShowFilters
        }}>
            <AppLayout>
                <View style={{ width: "100%", flexDirection: "row", height: "100%" }}>
                    <DiscoverInfluencer />
                    <RightPanelDiscover style={(!xl) && {
                        width: "100%",
                        maxWidth: "auto",
                        display: rightPanel ? "flex" : "none"
                    }} />
                </View>
            </AppLayout>
        </DiscoveryContext.Provider>
    );
};

export default DiscoverInfluencersScreen;
