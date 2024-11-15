import React, { useRef } from "react";
import Swiper from "react-native-swiper";
import stylesFn from "@/styles/tab1.styles";
import { useTheme } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import RenderMediaItem from "./render-media-item";

interface CarouselWebProps {
  data: any
  onImagePress: (data: any) => void;
};

const CarouselWeb: React.FC<CarouselWebProps> = ({
  data,
  onImagePress,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const swiperRef = useRef<Swiper>(null);
  const videoRefs = useRef<{ [key: number]: any }>({});

  const handleImagePress = (uri: string) => {
    if (onImagePress) {
      onImagePress(uri);
    }
  };

  return (
    <Swiper
      ref={swiperRef}
      height={560}
      style={styles.wrapper}
      dotStyle={styles.dotStyle}
      activeDotStyle={[
        styles.dotStyle,
        {
          backgroundColor: Colors(theme).primary,
        },
      ]}
      paginationStyle={styles.pagination}
    >
      {data.map((
        item: any,
        index: number,
      ) => (
        <RenderMediaItem
          handleImagePress={handleImagePress}
          height={560}
          index={index}
          item={item}
          key={item.id || index}
          videoRefs={videoRefs}
        />
      ))}
    </Swiper>
  );
};

export default CarouselWeb;
