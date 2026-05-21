import React, { createContext, useContext, useMemo } from "react";

interface LocationContextValue {
    isIndiaBased: boolean;
}

const LocationContext = createContext<LocationContextValue>({ isIndiaBased: false });

export const LocationContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isIndiaBased = useMemo(() => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            return tz === "Asia/Kolkata" || tz === "Asia/Calcutta";
        } catch {
            return false;
        }
    }, []);

    return (
        <LocationContext.Provider value={{ isIndiaBased }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocationContext = () => useContext(LocationContext);
