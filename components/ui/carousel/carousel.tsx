import { useRef, useState } from "react";
import {
  Dimensions,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";

import { View } from "@/components/theme/Themed";
import { stylesFn } from "@/styles/InfluencerCard.styles";
import { useTheme } from "@react-navigation/native";
import RenderMediaItem from "./render-media-item";

interface CarouselProps {
  data: any[]; // TODO: Add specific type
  onImagePress?: (data: any) => void;
}

const CarouselNative: React.FC<CarouselProps> = ({
  data,
  onImagePress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false);

  const videoRefs = useRef<{ [key: number]: any }>({});

  const theme = useTheme();
  const styles = stylesFn(theme);

  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
    setIsSwiping(true);
    // Reset swiping state after a short delay
    setTimeout(() => setIsSwiping(false), 150);
    Object.values(videoRefs.current).forEach((videoRef) => {
      if (videoRef && videoRef.seek) {
        videoRef.seek(0);
        setIsPlaying(false);
      }
    });
  };

  const handleImagePress = (uri: string) => {
    if (!isSwiping) {
      if (onImagePress) {
        onImagePress(uri);
      }
    }
  };

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        loop
        width={Dimensions.get("window").width - 45}
        height={250}
        data={data}
        renderItem={({ item, index }) => (
          <RenderMediaItem
            handleImagePress={handleImagePress}
            index={index}
            item={item}
            videoRefs={videoRefs}
          />
        )}
        onSnapToItem={handleIndexChange}
        style={{
          padding: 10,
        }}
      />

      <View style={styles.indicatorContainer}>
        {data.map((_: any, index: any) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default CarouselNative;
