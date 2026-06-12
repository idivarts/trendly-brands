import AdvancedFilterOverlay from "@/components/discover/AdvancedFilterOverlay";
import type { DB_TYPE } from "@/components/discover/discover-types";
import DiscoverInfluencer from "@/components/discover/DiscoverInfluencer";
import DiscoverScreenHeader from "@/components/discover/DiscoverScreenHeader";
import DiscoverSurvey from "@/components/discover/DiscoverSurvey";
import {
    DiscoveryProvider,
    OpenFilterRightPanel,
    type DiscoverCommunication,
    type PageSortCommunication,
} from "@/components/discover/discovery-context";
import { cleanFilters, hasMeaningfulFilters } from "@/components/discover/utils/filter-utils";
import {
    GUIDE_TOUR_MOBILE,
    GUIDE_TOUR_WEB,
} from "@/components/guide-tour/guide-tour-config";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import SlowLoader from "@/shared-uis/components/SlowLoader";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useCoachmark } from "@edwardloopez/react-native-coachmark";
import React, { useEffect, useRef, useState } from "react";

const DiscoverComponent = ({
    showRightPanel = true,
    showTopPanel = true,
    isStatusCard = false,
    defaultAdvanceFilters,
    /**
     * If false -> ignore the brand-saved persisted filters and only honour defaultAdvanceFilters.
     * Useful when Discover is used inside another screen (e.g., InvitationsTabContent) and you want
     * to show the collaboration's preferences only.
     */
    useStoredFilters = true,
    initialInfluencerId,
    /** When true, the guided tour (coach marks) is not started. Use when embedding Discover (e.g. Send Invitations tab). */
    skipGuideTour = false,
}: {
    showRightPanel?: boolean;
    showTopPanel?: boolean;
    isStatusCard?: boolean;
    defaultAdvanceFilters?: IAdvanceFilters;
    useStoredFilters?: boolean;
    initialInfluencerId?: string;
    skipGuideTour?: boolean;
}) => {
    const { manager } = useAuthContext();
    const { selectedBrand, updateBrand } = useBrandContext();
    const { start: startCoachmark } = useCoachmark();
    const hasStartedTourRef = useRef(false);
    const [rightPanel, setRightPanel] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterOverlayVisible, setFilterOverlayVisible] = useState(false);
    const [headerTotalCount, setHeaderTotalCount] = useState<string>("0");
    const [headerCurrentSort, setHeaderCurrentSort] = useState<string>("engagement");
    const discoverCommunication =
        useRef<((action: DiscoverCommunication) => any) | undefined>(undefined);
    const pageSortCommunication =
        useRef<((action: PageSortCommunication) => any) | undefined>(undefined);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { xl } = useBreakpoints();
    const guideTourShownKey =
        manager?.id
            ? `discover-guide-tour-shown-${manager.id}-${xl ? "web" : "mobile"}`
            : null;

    useEffect(() => {

        setRightPanel(Boolean(xl));
    }, [xl]);

    // Sync header sort from stored discoverPreferences when brand loads
    useEffect(() => {
        const storedSort = selectedBrand?.discoverPreferences?.sort;
        if (storedSort) {
            setHeaderCurrentSort(storedSort);
        }
    }, [selectedBrand?.discoverPreferences?.sort]);

    const [selectedDb, setSelectedDb] = useState<DB_TYPE>("trendly");

    useEffect(() => {
        const unsubs = OpenFilterRightPanel.subscribe(() => {
            if (!showRightPanel) return;
            setFilterOverlayVisible(true);
            setShowFilters(true);
            setIsCollapsed(false);
        });

        return () => unsubs.unsubscribe();
    }, [showRightPanel]);

    const hasBrandPreferences = hasMeaningfulFilters(
        selectedBrand?.discoverPreferences
    );
    const [showSurvey, setShowSurvey] = useState(false);
    const [surveyCheckDone, setSurveyCheckDone] = useState(false);

    useEffect(() => {
        if (!selectedBrand?.id) {
            setSurveyCheckDone(true);
            setShowSurvey(false);
            return;
        }
        (async () => {
            const surveyKey = `survey-completed-${selectedBrand.id}`;
            const completed = await PersistentStorage.get(surveyKey);
            const surveyDone = completed === "true" || hasBrandPreferences;
            setShowSurvey(!surveyDone);
            setSurveyCheckDone(true);
        })();
    }, [selectedBrand?.id, hasBrandPreferences]);

    const hasMeaningfulDefaults = hasMeaningfulFilters(defaultAdvanceFilters);

    const filtersToUse = hasMeaningfulDefaults
        ? defaultAdvanceFilters
        : useStoredFilters
            ? selectedBrand?.discoverPreferences
            : undefined;

    const filtersForChildren = hasMeaningfulDefaults
        ? defaultAdvanceFilters
        : useStoredFilters
            ? selectedBrand?.discoverPreferences
            : undefined;

    const handleSurveyComplete = async (filters: IAdvanceFilters) => {
        if (!selectedBrand?.id) {
            setShowSurvey(false);
            return;
        }
        const cleanedFilters = cleanFilters(filters);
        const surveyKey = `survey-completed-${selectedBrand.id}`;

        try {
            await PersistentStorage.set(surveyKey, "true");
        } catch (e) {
            Toaster.error("Failed to save preferences. Please try again");
            return;
        }

        if (hasMeaningfulFilters(cleanedFilters)) {
            try {
                await updateBrand(selectedBrand.id, {
                    discoverPreferences: cleanedFilters,
                });
                Toaster.success("Preferences saved!");
            } catch (error) {
                Toaster.error("Failed to save preferences. Please try again");
                return;
            }
        }

        setShowSurvey(false);
        if (skipGuideTour) return;
        if (guideTourShownKey) {
            // Mark as shown immediately so refresh/dismiss doesn't re-trigger it.
            await PersistentStorage.set(guideTourShownKey, "true");
        }
        hasStartedTourRef.current = true;
        startCoachmark(xl ? GUIDE_TOUR_WEB : GUIDE_TOUR_MOBILE);
    };

    if (!surveyCheckDone)
        return (
            <SlowLoader
                messages={[
                    "Loading brand information...",
                    "Preparing discovery...",
                    "Almost ready...",
                ]}
            />
        );

    const alwaysOpenSurveyToTest = false;
    if (showSurvey || alwaysOpenSurveyToTest)
        return (
            <AppLayout safeAreaEdges={["left", "right"]}>
                <DiscoverSurvey onComplete={handleSurveyComplete} />
            </AppLayout>
        );

    if (!manager || !selectedBrand || !selectedBrand.id)
        return (
            <SlowLoader
                messages={[
                    "Loading brand information...",
                    "Preparing discovery...",
                    "Almost ready...",
                ]}
            />
        );

    return (
        <DiscoveryProvider
            value={{
                selectedDb,
                setSelectedDb,
                rightPanel,
                setRightPanel,
                showFilters,
                setShowFilters,
                discoverCommunication,
                pageSortCommunication,
                isCollapsed,
                showRightPanel,
                setIsCollapsed,
                totalCount: headerTotalCount,
                currentSort: headerCurrentSort,
                setTotalCount: setHeaderTotalCount,
                setCurrentSort: setHeaderCurrentSort,
            }}
        >
            <AppLayout safeAreaEdges={["left", "right"]}>
                <View style={{ width: "100%", flex: 1, minHeight: 0 }}>
                    {showTopPanel && <DiscoverScreenHeader />}
                    <View style={{ width: "100%", flexDirection: "row", flex: 1, minHeight: 0 }}>
                        <DiscoverInfluencer
                            isStatusCard={isStatusCard}
                            defaultAdvanceFilters={filtersToUse}
                            initialInfluencerId={initialInfluencerId}
                            reduceHorizontalPadding={!showRightPanel}
                        />
                    </View>
                    {/* {showRightPanel && ( */}
                    <AdvancedFilterOverlay
                        visible={filterOverlayVisible}
                        onClose={() => setFilterOverlayVisible(false)}
                        defaultAdvanceFilters={filtersForChildren}
                        onClearStoredFilters={() => { }}
                        onFiltersApplied={() => { }}
                    />
                    {/* )} */}
                </View>
            </AppLayout>
        </DiscoveryProvider>
    );
};

export default DiscoverComponent;
