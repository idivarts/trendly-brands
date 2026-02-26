import React from "react";

export type DrawerColors = {
    inactiveColor: string;
    activeColor: string;
};

export const DrawerColorsContext = React.createContext<DrawerColors | null>(null);

export function useDrawerColors(): DrawerColors | null {
    return React.useContext(DrawerColorsContext);
}
