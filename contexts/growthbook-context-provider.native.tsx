

import React, { createContext, ReactNode, useContext, useState } from "react";

interface IGBContext {
    loading: boolean
}

// Create the GrowthBookContext with an empty object as default value
export const GrowthBookContext = createContext<IGBContext>({
    loading: false
});

// Define the props type for the provider
type GrowthBookProviderProps = {
    children: ReactNode;
};

export const useMyGrowthBook = () => useContext(GrowthBookContext)
// GrowthBookProvider functional component
const GrowthBookProvider: React.FC<GrowthBookProviderProps> = ({ children }) => {
    const [loading, setLoading] = useState(false)

    return (
        <GrowthBookContext.Provider value={{ loading }}>
            {children}
        </GrowthBookContext.Provider>
    );
};
// npm i --save @growthbook/growthbook-react


export default GrowthBookProvider;