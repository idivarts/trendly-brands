import React, { createContext, useCallback, useContext, useRef, useState } from "react";

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
    /**
     * True while the collapsed rail is temporarily showing its expanded layout
     * as a panel floating *over* the page content (desktop hover). The page
     * never reflows for it — `isCollapsed` stays true and the drawer column
     * keeps its collapsed width.
     */
    isFloating: boolean;
    /** Show the floating panel. No-op unless the rail is collapsed with no sub-drawer open. */
    openFloating: () => void;
    /** Hide the floating panel. */
    closeFloating: () => void;
    /** Keep the floating panel open for good — turns it into a real expanded rail. */
    pinFloating: () => void;
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
    isFloating: false,
    openFloating: () => {},
    closeFloating: () => {},
    pinFloating: () => {},
});

export const SidebarCollapsedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [subDrawerKind, setSubDrawerKind] = useState<SubDrawerKind>(null);
    const [isFloating, setIsFloating] = useState(false);
    // Remembers whether the rail was collapsed before the sub-drawer was opened,
    // so closing restores the user's prior state.
    const collapsedBeforeSubDrawer = useRef(false);

    const subDrawerOpen = subDrawerKind !== null;

    // Expanding the rail (or opening a sub-drawer) makes the hover panel
    // redundant, so every state change below dismisses it.
    const setCollapsed = (value: boolean) => {
        setIsCollapsed(value);
        if (!value) setIsFloating(false);
    };

    // Expanding/collapsing the rail also dismisses the sub-drawer.
    const toggle = () => {
        if (subDrawerOpen) setSubDrawerKind(null);
        setIsFloating(false);
        setIsCollapsed((v) => !v);
    };

    const openSubDrawer = (kind: Exclude<SubDrawerKind, null> = "ilg") => {
        if (!subDrawerOpen) {
            collapsedBeforeSubDrawer.current = isCollapsed;
        }
        setIsFloating(false);
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

    const openFloating = useCallback(() => {
        // Only the collapsed rail floats; a sub-drawer already owns that space.
        if (!isCollapsed || subDrawerOpen) return;
        setIsFloating(true);
    }, [isCollapsed, subDrawerOpen]);

    const closeFloating = useCallback(() => setIsFloating(false), []);

    const pinFloating = useCallback(() => {
        setIsFloating(false);
        setIsCollapsed(false);
    }, []);

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
                isFloating,
                openFloating,
                closeFloating,
                pinFloating,
            }}
        >
            {children}
        </SidebarCollapsedContext.Provider>
    );
};

export const useSidebarCollapsed = () => useContext(SidebarCollapsedContext);
