import { useTheme } from "@react-navigation/native";
import { Link } from "expo-router";
import { Image, Pressable } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

import { useBrandContext } from "@/contexts/brand-context.provider";
import Colors from "@/constants/Colors";
import { View } from "../theme/Themed";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { imageUrl } from "@/utils/url";

const ProfileIcon = () => {
  const theme = useTheme();
  const {
    selectedBrand,
  } = useBrandContext();

  return (
    <Link href="/menu" asChild>
      <Pressable>
        {({ pressed }) => (
          <View
            style={{
              position: "relative",
              marginRight: 15,
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
                opacity: pressed ? 0.5 : 1,
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
        )}
      </Pressable>
    </Link>
  )
};

export default ProfileIcon;
