

import React, { createContext, PropsWithChildren, ReactNode, useContext, useEffect, useState } from "react";

import { Console } from "@/shared-libs/utils/console";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { GrowthBook } from "@growthbook/growthbook";
import { GrowthBookProvider, useFeatureValue } from "@growthbook/growthbook-react";
import { autoAttributesPlugin } from "@growthbook/growthbook/plugins";

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

interface IGBContext {
    loading: boolean
}

// Create the GrowthBookContext with an empty object as default value
export const GrowthBookContext = createContext<IGBContext>({
    loading: true
});

// Define the props type for the provider
type GrowthBookProviderProps = {
    children: ReactNode;
};

export const useMyGrowthBook = () => useContext(GrowthBookContext)
// GrowthBookProvider functional component
const GBProvider: React.FC<GrowthBookProviderProps> = ({ children }) => {
    const [loading, setLoading] = useState(true)
    const x = useFeatureValue<string>("demoLink", "");
    Console.log("Demo Link", x);

    return (
        <GrowthBookContext.Provider value={{ loading }}>
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