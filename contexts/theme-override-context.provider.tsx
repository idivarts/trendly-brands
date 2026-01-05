import {
    createContext,
    useContext,
    useState,
    type PropsWithChildren,
} from "react";

type ThemeMode = "light" | "dark";

interface ThemeOverrideContextProps {
    themeOverride: ThemeMode | null;
    setThemeOverride: (theme: ThemeMode | null) => void;
}

const ThemeOverrideContext = createContext<ThemeOverrideContextProps>({
    themeOverride: null,
    setThemeOverride: () => { },
});

export const useThemeOverride = () => useContext(ThemeOverrideContext);

export const ThemeOverrideProvider = ({ children }: PropsWithChildren) => {
    const [themeOverride, setThemeOverride] = useState<ThemeMode | null>(null);

    return (
        <ThemeOverrideContext.Provider value={{ themeOverride, setThemeOverride }}>
            {children}
        </ThemeOverrideContext.Provider>
    );
};

export type { ThemeMode };
