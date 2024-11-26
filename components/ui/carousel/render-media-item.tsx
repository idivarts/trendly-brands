import {
  Image,
  Platform,
} from "react-native";
import Animated from "react-native-reanimated";
import { ResizeMode, Video } from "expo-av";
import {
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";

import { stylesFn } from "@/styles/InfluencerCard.styles";
import { useTheme } from "@react-navigation/native";
import { imageUrl } from "@/utils/url";

export interface MediaItem {
  type: string;
  url: string;
}

interface RenderMediaItemProps {
  handleImagePress: (item: MediaItem) => void;
  height?: number;
  index: number;
  item: MediaItem;
  videoRefs?: React.MutableRefObject<{ [key: number]: any }>;
  width?: number;
}

const RenderMediaItem: React.FC<RenderMediaItemProps> = ({
  handleImagePress,
  height,
  index,
  item,
  videoRefs,
  width,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  if (item?.type.includes("image")) {
    return (
      <TapGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            handleImagePress(item);
          }
        }}
      >
        <Animated.View>
          <Image
            source={imageUrl(item.url)}
            style={[
              styles.media,
              {
                height: height || 250,
                width: width || "100%",
              }
            ]}
            resizeMode="stretch"
          />
        </Animated.View>
      </TapGestureHandler>
    );
  }

  return (
    <Video
      ref={(ref) => {
        if (ref && videoRefs) {
          videoRefs.current[index] = ref;
        }
      }}
      source={
        item.url
          ? {
            uri: item.url,
          }
          : require("@/assets/videos/ForBiggerJoyrides.mp4")
      }
      style={[
        styles.media,
        {
          height: height || 250,
          width: width || "100%",
        }
      ]}
      resizeMode={ResizeMode.COVER}
      isLooping={false}
      shouldPlay={false}
      useNativeControls
      onError={(error) => console.error("Video Error:", error)}
    />
  );
};

export default RenderMediaItem;
