import { Theme, useTheme } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";

import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import BottomSheetContainer from "@/shared-uis/components/bottom-sheet";
import Colors, { ColorsStatic } from "@/shared-uis/constants/Colors";
import { handleDeepLink } from "@/utils/deeplink";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { usePathname } from "expo-router";
import { Image, Linking, Pressable, StyleSheet } from "react-native";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";

interface DownloadAppModalProps {
  collaborationId?: string;
}

const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  collaborationId,
}) => {
  const snapPoints = useMemo(() => ["25%", "25%"], []);

  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname()
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  const openUrl = async () => {
    const url = `trendly-brands:/${pathname}`
    Console.log("Opening URL", url)
    const canOpen = await Linking.canOpenURL(url)
    Console.log("Can Open URL ", canOpen)
    if (canOpen) {
      const mWindow = window.open(url, "_parent");
      if (mWindow) {
        // setIsAppInstalled(true)
        // setTimeout(() => {
        //   if (mWindow && !mWindow.closed) {
        //     mWindow.close();
        //   }
        // }, 5000);
      }
    }
  }
  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 5000);
    openUrl()
  }, [])

  const {
    lg,
  } = useBreakpoints();

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <BottomSheetContainer
      snapPoints={snapPoints}
      isVisible={isVisible}
      onClose={handleClose}>
      <View
        style={styles.container}
      >
        <View
          style={styles.header}
        >
          <Image source={require('@/assets/images/icon2.png')} style={{ width: 80, height: 80, borderColor: ColorsStatic.primary, borderWidth: 2, borderRadius: 20 }} />
          <View style={{ flex: 1, alignItems: "flex-start", marginLeft: 16, gap: 8 }}>
            <Text style={styles.headerTitle}>
              Available on AppStore
            </Text>
            <Text style={styles.headerText}>
              Donwload the app now for best user experience
            </Text>
          </View>

          <Pressable
            onPress={handleClose}
            style={{
              zIndex: 10,
            }}
          >
            <FontAwesomeIcon
              color={Colors(theme).primary}
              icon={faClose}
              size={24}
            />
          </Pressable>
        </View>
        <Button
          style={{
            marginTop: 12
          }}
          theme={{
            colors: {
              primary: Colors(theme).primary,
            },
          }}
          onPress={() => {
            if (isAppInstalled)
              openUrl()
            else
              handleDeepLink(undefined, lg);
          }}
        >
          {isAppInstalled ? "Open App" : "Download App Now"}
        </Button>
      </View>
    </BottomSheetContainer>
  );
};

export default DownloadAppModal;

const stylesFn = (theme: Theme) => StyleSheet.create({
  bottomSheetScrollViewContentContainer: {
    flex: 1,
    marginTop: 10,
    marginBottom: 50,
  },
  container: {
    justifyContent: "space-between",
    marginHorizontal: 16,
    flex: 1,
  },
  header: {
    alignItems: "flex-start",
    backgroundColor: Colors(theme).transparent,
    flexDirection: "row",
  },
  headerTitle: {
    fontSize: 18,
    color: Colors(theme).text,
    fontWeight: "600",
    textAlign: "left",
  },
  headerText: {
    fontSize: 16,
    color: Colors(theme).text,
    textAlign: "left",
  },
});
