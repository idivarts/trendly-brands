import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import SelectGroup from "@/shared-uis/components/select/select-group";
import stylesFn from "@/styles/settings/Settings.styles";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";
import ScreenHeader from "../ui/screen-header";

const Settings = () => {
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light");
  const { manager, updateManager } = useAuthContext();
  const theme = useTheme();
  const styles = stylesFn(theme);

  const themeChange = async () => {
    if (!manager) {
      return;
    }

    updateManager(manager?.id, {
      settings: {
        theme: selectedTheme,
      },
    });
  };

  useEffect(() => {
    if (manager?.settings?.theme) {
      setSelectedTheme(manager.settings.theme);
    }
  }, [manager]);

  return (
    //@ts-ignore
    <>
      <ScreenHeader
        title="Settings"
        rightAction
        rightActionButton={
          <Pressable onPress={() => themeChange()}>
            <Text
              style={{
                color: Colors(theme).text,
                fontSize: 16,
                marginRight: 16,
              }}
            >
              Save
            </Text>
          </Pressable>
        }
      />
      <AppLayout>
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
                label: selectedTheme,
                value: selectedTheme,
              }}
              onValueChange={(item) => {
                setSelectedTheme(item.value as "light" | "dark");
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
