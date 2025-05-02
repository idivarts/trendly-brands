import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Image, Pressable } from "react-native";

import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { imageUrl } from "@/utils/url";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { View } from "../theme/Themed";

const ProfileIcon = () => {
  const theme = useTheme();
  const {
    selectedBrand,
  } = useBrandContext();
  const router = useRouter()
  return (
    <Pressable onPress={() => router.push("/menu")}>
      <View
        style={{
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FontAwesomeIcon
          color={Colors(theme).primary}
          icon={faCircleNotch}
          size={32}
          style={{
            left: -2,
            position: "absolute",
            top: -2,
            zIndex: 1,
          }}
        />
        <Image
          source={imageUrl(selectedBrand?.image)}
          style={{
            borderRadius: 100,
            height: 28,
            width: 28,
          }}
        />
      </View>
    </Pressable>
  )
};

export default ProfileIcon;
