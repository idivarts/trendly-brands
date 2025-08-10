

import React, { createContext, PropsWithChildren, ReactNode, useContext, useEffect, useState } from "react";

import { Console } from "@/shared-libs/utils/console";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { GrowthBook, JSONValue } from "@growthbook/growthbook";
import { GrowthBookProvider, useFeatureValue } from "@growthbook/growthbook-react";
import { autoAttributesPlugin } from "@growthbook/growthbook/plugins";
import { useBrandContext } from "./brand-context.provider";

const growthbook = new GrowthBook({
    apiHost: "https://cdn.growthbook.io",
    clientKey: process.env.EXPO_PUBLIC_GROWTHBOOK_KEY ? process.env.EXPO_PUBLIC_GROWTHBOOK_KEY : "sdk-8f9p2nIHLJAk2dgh",
    enableDevMode: true,
    trackingCallback: (experiment, result) => {
        // This is where you would send an event to your analytics provider
        analyticsLogEvent("experiment_viewed", {
            experiment_id: experiment.key,
            variation_id: result.key,
            experiment_name: experiment.name,
        })
        // console.log;
    },
    plugins: [autoAttributesPlugin()],
});

export interface ExplainerConfig {
    /**
     * Title with an optional focused fragment wrapped in curly braces.
     * Example: "Create your {brand}" -> "brand" uses `styles.titleAccent`.
     */
    title: string;
    /** Optional Short text on top of the title. */
    kicker?: string
    /** Optional short paragraph shown under the title (hidden on narrow layouts). */
    description?: string;
    /** Optional bullet/point items (hidden on narrow layouts). */
    items?: Array<string>;
    /** Optional image URL. If provided, a 16:9 visual is rendered. */
    image?: string;
    /** Optional Button text */
    action?: string;
    /** Optional Button text */
    showOfferCard?: boolean;
}

interface GBFeatures {
    actionType: string;
    demoLink: string;
    discountTimer: number;
    imageUrl: string;
    isPaywallClosable: boolean;
    limitedTimeDiscount: number;
    moneyBackGuarantee: number;
    trialDays: number;
    videoMediaType: boolean;
    videoUrl: string;
    getStarted?: ExplainerConfig,
    createBrand?: ExplainerConfig,
    aboutBrand?: ExplainerConfig,
    pricingPage?: ExplainerConfig,
    businessFeatures?: string[]
    growthFeatures?: string[]
    hideAboutBrand?: boolean,
}

interface IGBContext {
    loading: boolean;
    features: GBFeatures;
    discountEndTime: number,
    discountPercentage: () => number
}

// Create the GrowthBookContext with an initial default value
export const GrowthBookContext = createContext<IGBContext>({
    loading: true,
    features: {
        actionType: "",
        demoLink: "https://cal.com/rahul-idiv/30min",
        discountTimer: 10,
        imageUrl: "",
        isPaywallClosable: false,
        limitedTimeDiscount: 10,
        moneyBackGuarantee: 7,
        trialDays: 3,
        videoMediaType: true,
        videoUrl: "https://youtu.be/X1Of8cALHRo?si=XvXxb94STjnr7-XW"
    },
    discountEndTime: 0,
    discountPercentage: () => 0
});

// Define the props type for the provider
type GrowthBookProviderProps = {
    children: ReactNode;
};

export const useMyGrowthBook = () => useContext(GrowthBookContext)
// GrowthBookProvider functional component
const GBProvider: React.FC<GrowthBookProviderProps> = ({ children }) => {
    const loading = useFeatureValue<boolean>("loading", false);

    const [discountEndTime, setDiscountEndTime] = useState(0)
    // Fetch feature values from GrowthBook
    const actionType = useFeatureValue<string>("action-type", "");
    const demoLink = useFeatureValue<string>("demoLink", "https://cal.com/rahul-idiv/30min");
    const discountTimer = useFeatureValue<number>("discount-timer", 0);
    const imageUrl = useFeatureValue<string>("imageUrl", "");
    const isPaywallClosable = useFeatureValue<boolean>("is-paywall-closable", false);
    const limitedTimeDiscount = useFeatureValue<number>("limited-time-discount", 10);
    const moneyBackGuarantee = useFeatureValue<number>("money-back-guarantee", 7);
    const trialDays = useFeatureValue<number>("trial-days", 3);
    const videoMediaType = useFeatureValue<boolean>("videoMediaType", true);
    const videoUrl = useFeatureValue<string>("videoUrl", "https://youtu.be/X1Of8cALHRo?si=XvXxb94STjnr7-XW");
    const { selectedBrand, updateBrand } = useBrandContext()

    const getStarted: any = useFeatureValue<JSONValue>("get-started", null);
    const createBrand: any = useFeatureValue<JSONValue>("create-brand", null);
    const aboutBrand: any = useFeatureValue<JSONValue>("about-brand", null);
    const pricingPage: any = useFeatureValue<JSONValue>("pricing-page", null);

    const businessFeatures: any = useFeatureValue<string[] | null>("business-features", null);
    const growthFeatures: any = useFeatureValue<string[] | null>("growth-features", null);

    const hideAboutBrand: any = useFeatureValue<boolean>("hide-about-brand", false);

    const features: GBFeatures = {
        actionType,
        demoLink,
        discountTimer,
        imageUrl,
        isPaywallClosable,
        limitedTimeDiscount,
        moneyBackGuarantee,
        trialDays,
        videoMediaType,
        videoUrl,
        getStarted,
        createBrand,
        aboutBrand,
        pricingPage,
        businessFeatures,
        growthFeatures,
        hideAboutBrand
    };

    Console.log("Growthbook Initialized", { loading, features });

    useEffect(() => {
        if (discountTimer > 0) {
            if (!sessionStorage.getItem("discountEndTime"))
                sessionStorage.setItem("discountEndTime", "" + (Date.now() + discountTimer * 60 * 1000))
            const p = sessionStorage.getItem("discountEndTime")
            const dTime = p ? parseInt(p) : 0
            setDiscountEndTime(dTime)
        }
    }, [discountTimer])

    const brandId = selectedBrand?.id
    useEffect(() => {
        if (brandId) {
            updateBrand(brandId, {
                growthBook: {
                    ...features,
                    discountEndTime,
                }
            })
        }
    }, [brandId])

    const discountPercentage = () => {
        if (discountTimer > 0 && discountEndTime < Date.now()) {
            return 0
        }
        return limitedTimeDiscount
    }

    return (
        <GrowthBookContext.Provider value={{ loading, features, discountEndTime, discountPercentage }}>
            {children}
        </GrowthBookContext.Provider>
    );
};

const GrowthBookApp: React.FC<PropsWithChildren> = ({ children }) => {
    useEffect(() => {
        // Load features asynchronously when the app renders
        growthbook.init({ streaming: true });
    }, []);
    return <GrowthBookProvider growthbook={growthbook}>
        <GBProvider>{children}</GBProvider>
    </GrowthBookProvider>
}

export default GrowthBookApp;