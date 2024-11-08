import { useEffect, useState } from "react";
import { Text, View } from "../theme/Themed"
import { Switch } from "react-native-paper";
import { useAuthContext } from "@/contexts";
import stylesFn from "@/styles/settings/Settings.styles";
import { useTheme } from "@react-navigation/native";

const Settings = () => {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const {
    manager,
    updateManager
  } = useAuthContext();
  const theme = useTheme();
  const styles = stylesFn(theme);

  const onToggleSwitch = () => {
    setIsSwitchOn(!isSwitchOn);
    if (!manager) {
      return;
    }

    updateManager(
      manager?.id,
      {
        settings: {
          theme: isSwitchOn ? "light" : "dark"
        },
      },
    );
  };

  useEffect(() => {
    if (manager?.settings?.theme) {
      setIsSwitchOn(manager.settings.theme === "dark");
    }
  }, [manager]);

  return (
    <View
      style={styles.settingsContainer}
    >
      <View
        style={styles.settingsRow}
      >
        <Text
          style={styles.settingsLabel}
        >
          Theme ({isSwitchOn ? "Dark" : "Light"})
        </Text>
        <Switch
          value={isSwitchOn}
          onValueChange={onToggleSwitch}
        />
      </View>
    </View>
  );
};

export default Settings;
