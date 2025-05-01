import { View } from "@/components/theme/Themed";
import { imageUrl } from "@/utils/url";
import { Linking } from "react-native";
import EmptyState from "../ui/empty-state";

const ChannelListWeb = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <EmptyState
        title="Download Mobile App"
        subtitle="Messaging is only available on mobile app. Download the mobile app today"
        action={() => {
          Linking.openURL(
            "https://apps.apple.com/us/app/trendly-for-brands/id6736949941"
          );
        }}
        actionLabel="Download Mobile App"
        image={imageUrl(require("@/assets/images/illustration7.png"))}
      />
    </View>
  );
};

export default ChannelListWeb;
