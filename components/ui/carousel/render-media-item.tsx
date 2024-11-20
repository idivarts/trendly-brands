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

interface RenderMediaItemProps {
  handleImagePress: (uri: string) => void;
  height?: number;
  index: number;
  item: any;
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

  if (item?.type === "image") {
    return (
      <TapGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            handleImagePress(item.uri);
          }
        }}
      >
        <Animated.View>
          <Image
            source={imageUrl(item.url || item.uri)}
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
        item.appleUrl
          ? {
            uri: Platform.OS === "ios" ? item.appleUrl : item.playUrl,
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
