import { useEffect, useState } from "react";
import { Text, View } from "../theme/Themed";
import { useAuthContext } from "@/contexts";
import stylesFn from "@/styles/settings/Settings.styles";
import { useTheme } from "@react-navigation/native";
import SelectGroup from "@/shared-uis/components/select/select-group";
import Colors from "@/constants/Colors";
import ScreenHeader from "../ui/screen-header";
import { Pressable } from "react-native";
import Button from "../ui/button";

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
      <View style={styles.settingsContainer}>
        <View style={styles.settingsRow}>
          <Text
            style={{
              ...styles.settingsLabel,
              color: Colors(theme).text,
              fontWeight: "bold",
            }}
          >
            App Theme
          </Text>
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
          <Text style={styles.settingsLabel}>
            Decide the theme of the platform
          </Text>
        </View>
        <Button
          mode="contained"
          style={{ margin: 20, width: "100%", paddingHorizontal: 20 }}
          onPress={() => {
            themeChange();
          }}
        >
          Save
        </Button>
      </View>
    </>
  );
};

export default Settings;
