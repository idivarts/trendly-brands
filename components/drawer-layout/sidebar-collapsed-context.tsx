import React, { createContext, useContext, useRef, useState } from "react";

export type SubDrawerKind = "ilg" | "admin" | null;

interface SidebarCollapsedContextType {
    isCollapsed: boolean;
    toggle: () => void;
    setCollapsed: (value: boolean) => void;
    /** Which sub-drawer (if any) is currently open. */
    subDrawerKind: SubDrawerKind;
    /** True when any sub-drawer is open (derived from `subDrawerKind`). */
    subDrawerOpen: boolean;
    /** Legacy boolean setter — opens "ilg" when true, closes when false. */
    setSubDrawerOpen: (value: boolean) => void;
    /** Collapse the rail and open the named sub-drawer (defaults to "ilg"). */
    openSubDrawer: (kind?: Exclude<SubDrawerKind, null>) => void;
    /** Close the active sub-drawer and restore the prior collapse state. */
    closeSubDrawer: () => void;
    /** Toggle the named sub-drawer (defaults to "ilg"). */
    toggleSubDrawer: (kind?: Exclude<SubDrawerKind, null>) => void;
}

export const SidebarCollapsedContext = createContext<SidebarCollapsedContextType>({
    isCollapsed: false,
    toggle: () => {},
    setCollapsed: () => {},
    subDrawerKind: null,
    subDrawerOpen: false,
    setSubDrawerOpen: () => {},
    openSubDrawer: () => {},
    closeSubDrawer: () => {},
    toggleSubDrawer: () => {},
});

export const SidebarCollapsedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [subDrawerKind, setSubDrawerKind] = useState<SubDrawerKind>(null);
    // Remembers whether the rail was collapsed before the sub-drawer was opened,
    // so closing restores the user's prior state.
    const collapsedBeforeSubDrawer = useRef(false);

    const subDrawerOpen = subDrawerKind !== null;

    const setCollapsed = (value: boolean) => setIsCollapsed(value);

    // Expanding/collapsing the rail also dismisses the sub-drawer.
    const toggle = () => {
        if (subDrawerOpen) setSubDrawerKind(null);
        setIsCollapsed((v) => !v);
    };

    const openSubDrawer = (kind: Exclude<SubDrawerKind, null> = "ilg") => {
        if (!subDrawerOpen) {
            collapsedBeforeSubDrawer.current = isCollapsed;
        }
        setIsCollapsed(true);
        setSubDrawerKind(kind);
    };
    const closeSubDrawer = () => {
        setSubDrawerKind(null);
        setIsCollapsed(collapsedBeforeSubDrawer.current);
    };
    const toggleSubDrawer = (kind: Exclude<SubDrawerKind, null> = "ilg") => {
        if (subDrawerKind === kind) closeSubDrawer();
        else openSubDrawer(kind);
    };

    const setSubDrawerOpen = (value: boolean) => {
        if (value) openSubDrawer("ilg");
        else closeSubDrawer();
    };

    return (
        <SidebarCollapsedContext.Provider
            value={{
                isCollapsed,
                toggle,
                setCollapsed,
                subDrawerKind,
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
