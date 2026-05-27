import React, { createContext, useContext, useState } from "react";

interface SidebarCollapsedContextType {
    isCollapsed: boolean;
    toggle: () => void;
}

const SidebarCollapsedContext = createContext<SidebarCollapsedContextType>({
    isCollapsed: false,
    toggle: () => {},
});

export const SidebarCollapsedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggle = () => setIsCollapsed((v) => !v);

    return (
        <SidebarCollapsedContext.Provider value={{ isCollapsed, toggle }}>
            {children}
        </SidebarCollapsedContext.Provider>
    );
};

export const useSidebarCollapsed = () => useContext(SidebarCollapsedContext);
