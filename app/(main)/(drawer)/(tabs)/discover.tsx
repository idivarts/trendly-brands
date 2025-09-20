import DiscoverInfluencer, { InfluencerItem } from "@/components/discover/DiscoverInfluencer";
import RightPanelDiscover, { DB_TYPE } from "@/components/discover/RightPanelDiscover";
import FullInformationalIllustration from "@/components/FullScreenIllustration";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import React, { createContext, MutableRefObject, useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { Subject } from "rxjs";

export const OpenFilterRightPanel = new Subject()

export interface DiscoverCommunication {
    loading?: boolean;
    data: InfluencerItem[];
    total?: number;
    page?: number;
    pageCount?: number;
    sort?: string;
}
export interface PageSortCommunication {
    page?: number;
    sort?: string;
}
interface DiscoveryProps {
    selectedDb: DB_TYPE,
    setSelectedDb: Function
    rightPanel: boolean,
    setRightPanel: Function
    showFilters: boolean
    setShowFilters: Function
    discoverCommunication: MutableRefObject<((action: DiscoverCommunication) => any) | undefined>
    pageSortCommunication: MutableRefObject<((action: PageSortCommunication) => any) | undefined>
}
const DiscoveryContext = createContext<DiscoveryProps>({} as DiscoveryProps)
export const useDiscovery = () => useContext(DiscoveryContext)

const DiscoverInfluencersScreen = () => {
    const { manager } = useAuthContext()
    const { selectedBrand } = useBrandContext()
    const [rightPanel, setRightPanel] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const discoverCommunication = useRef<(action: DiscoverCommunication) => any>()
    const pageSortCommunication = useRef<(action: PageSortCommunication) => any>()

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
            title: "{Advanced Filtering} for Instagram Profiles",
            description: "Find the right influencer in seconds with powerful filters. Skip scrolling through hundreds of profiles — save time and connect with creators that truly fit your campaign.",
            action: "Discover Now",
            items: [
                "Target Micro-Influencers (under 100k followers)",
                "Trustability & Budget Insights",
                "See Estimated Views Upfront"
            ],
            image: "https://d1tfun8qrz04mk.cloudfront.net/uploads/file_1758395157_images-1758395157102-discovery tool walkthrough thumbnail.jpg"
        }} videoUrl="https://www.youtube.com/embed/oqYLHTnszIg?si=NTYuarzgkbLEPhTO" />

    if (!manager || !selectedBrand || !selectedBrand.id)
        return <ActivityIndicator />

    return (
        <DiscoveryContext.Provider value={{
            selectedDb,
            setSelectedDb,
            rightPanel,
            setRightPanel,
            showFilters, setShowFilters,
            discoverCommunication,
            pageSortCommunication
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
