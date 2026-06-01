import React, { createContext, useContext, useRef, useState } from "react";

interface SidebarCollapsedContextType {
    isCollapsed: boolean;
    toggle: () => void;
    setCollapsed: (value: boolean) => void;
    /** Whether the "Influencer Led Growth" sub-drawer is open. */
    subDrawerOpen: boolean;
    setSubDrawerOpen: (value: boolean) => void;
    /** Collapse the rail and open the sub-drawer (remembers prior collapse state). */
    openSubDrawer: () => void;
    /** Close the sub-drawer and restore the prior collapse state. */
    closeSubDrawer: () => void;
    /** Toggle the sub-drawer open/closed. */
    toggleSubDrawer: () => void;
}

export const SidebarCollapsedContext = createContext<SidebarCollapsedContextType>({
    isCollapsed: false,
    toggle: () => {},
    setCollapsed: () => {},
    subDrawerOpen: false,
    setSubDrawerOpen: () => {},
    openSubDrawer: () => {},
    closeSubDrawer: () => {},
    toggleSubDrawer: () => {},
});

export const SidebarCollapsedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [subDrawerOpen, setSubDrawerOpen] = useState(false);
    // Remembers whether the rail was collapsed before the sub-drawer was opened,
    // so closing restores the user's prior state.
    const collapsedBeforeSubDrawer = useRef(false);

    const setCollapsed = (value: boolean) => setIsCollapsed(value);

    // Expanding/collapsing the rail also dismisses the sub-drawer.
    const toggle = () => {
        if (subDrawerOpen) setSubDrawerOpen(false);
        setIsCollapsed((v) => !v);
    };

    const openSubDrawer = () => {
        collapsedBeforeSubDrawer.current = isCollapsed;
        setIsCollapsed(true);
        setSubDrawerOpen(true);
    };
    const closeSubDrawer = () => {
        setSubDrawerOpen(false);
        setIsCollapsed(collapsedBeforeSubDrawer.current);
    };
    const toggleSubDrawer = () => {
        if (subDrawerOpen) closeSubDrawer();
        else openSubDrawer();
    };

    return (
        <SidebarCollapsedContext.Provider
            value={{
                isCollapsed,
                toggle,
                setCollapsed,
                subDrawerOpen,
                setSubDrawerOpen,
                openSubDrawer,
                closeSubDrawer,
                toggleSubDrawer,
            }}
        >
            {children}
        </SidebarCollapsedContext.Provider>
    );
};

export const useSidebarCollapsed = () => useContext(SidebarCollapsedContext);
