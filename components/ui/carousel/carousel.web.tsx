import React, { useRef } from "react";
import Swiper from "react-native-swiper";
import stylesFn from "@/styles/tab1.styles";
import { useTheme } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import RenderMediaItem, { MediaItem } from "./render-media-item";
import { View } from "@/components/theme/Themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

interface CarouselWebProps {
  data: MediaItem[];
  onImagePress: (data: MediaItem) => void;
};

const CarouselWeb: React.FC<CarouselWebProps> = ({
  data,
  onImagePress,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const swiperRef = useRef<Swiper>(null);
  const videoRefs = useRef<{ [key: number]: any }>({});

  const handleImagePress = (item: MediaItem) => {
    if (onImagePress) {
      onImagePress(item);
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
      pagingEnabled
      showsButtons={data.length > 1}
      nextButton={
        <View
          style={styles.buttonWrapper}
        >
          <FontAwesomeIcon
            icon={faChevronRight}
            size={20}
            color={Colors(theme).black}
          />
        </View>
      }
      prevButton={
        <View
          style={styles.buttonWrapper}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            size={20}
            color={Colors(theme).black}
          />
        </View>
      }
    >
      {
        data.map((
          item: MediaItem,
          index: number,
        ) => (
          <RenderMediaItem
            handleImagePress={handleImagePress}
            height={560}
            index={index}
            item={item}
            key={item.url || index}
            videoRefs={videoRefs}
          />
        ))
      }
    </Swiper >
  );
};

export default CarouselWeb;
