import { useColorScheme } from "@/components/theme/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuthContext, useThemeOverride } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import SelectGroup from "@/shared-uis/components/select/select-group";
import stylesFn from "@/styles/settings/Settings.styles";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Pressable } from "react-native";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";
import ScreenHeader from "../ui/screen-header";

type ThemeMode = "light" | "dark";

const Settings = () => {
    const { manager, updateManager } = useAuthContext();
    const { setThemeOverride } = useThemeOverride();
    const colorScheme = useColorScheme();
    const theme = useTheme();
    const styles = stylesFn(theme);
    const persistedTheme = (manager?.settings?.theme ?? colorScheme) as ThemeMode;

    const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(persistedTheme);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [savePending, setSavePending] = useState(false);

    const themeChange = async () => {
        if (!manager) {
            return;
        }

        setSavePending(true);
        setThemeOverride(selectedTheme);

        try {
            await updateManager(manager.id, {
                settings: {
                    theme: selectedTheme,
                },
            });
        } catch (error) {
            setSavePending(false);
        }
    };

    useEffect(() => {
        if (!hasUnsavedChanges && !savePending) {
            setSelectedTheme(persistedTheme);
        }
    }, [hasUnsavedChanges, persistedTheme, savePending]);

    useEffect(() => {
        if (savePending && manager?.settings?.theme === selectedTheme) {
            setSavePending(false);
            setHasUnsavedChanges(false);
            setThemeOverride(null);
        }
    }, [manager?.settings?.theme, savePending, selectedTheme, setThemeOverride]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (hasUnsavedChanges && !savePending) {
                    setThemeOverride(null);
                    setSelectedTheme(persistedTheme);
                    setHasUnsavedChanges(false);
                }
            };
        }, [hasUnsavedChanges, persistedTheme, savePending, setThemeOverride])
    );

    return (
        //@ts-ignore
        <>
            <ScreenHeader
                title="Settings"
                rightAction
                // rightActionButton={
                //     <Pressable onPress={() => themeChange()}>
                //         <Text
                //             style={{
                //                 color: Colors(theme).text,
                //                 fontSize: 16,
                //                 marginRight: 16,
                //             }}
                //         >
                //             Save
                //         </Text>
                //     </Pressable>
                // }
            />
            <AppLayout safeAreaEdges={["bottom", "left", "right"]}>
                <View style={styles.settingsContainer}>
                    <ContentWrapper
                        theme={theme}
                        title="App Theme"
                        description="Decide the theme of the platform"
                    >
                        <SelectGroup
                            items={[
                                { label: "Light", value: "light" },
                                { label: "Dark", value: "dark" },
                            ]}
                            selectedItem={{
                                label:
                                    selectedTheme === "light"
                                        ? "Light"
                                        : "Dark",
                                value: selectedTheme,
                            }}
                            onValueChange={(item) => {
                                const nextTheme = item.value as ThemeMode;
                                setSelectedTheme(nextTheme);

                                if (nextTheme === persistedTheme) {
                                    setHasUnsavedChanges(false);
                                    setThemeOverride(null);
                                    return;
                                }

                                setHasUnsavedChanges(true);
                                setThemeOverride(nextTheme);
                            }}
                            theme={theme}
                        />
                    </ContentWrapper>
                    <Button
                        mode="contained"
                        style={{ width: "100%", paddingHorizontal: 20 }}
                        onPress={() => {
                            themeChange();
                        }}
                    >
                        Save
                    </Button>
                </View>
            </AppLayout>
        </>
    );
};

export default Settings;
