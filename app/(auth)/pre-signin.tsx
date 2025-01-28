import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
} from "react-native";
import { Title, Paragraph } from "react-native-paper";
import stylesFn from "@/styles/tab1.styles";
import { useTheme } from "@react-navigation/native";
import AppLayout from "@/layouts/app-layout";
import { slides } from "@/constants/Slides";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { imageUrl } from "@/utils/url";
import Button from "@/components/ui/button";
import SocialButton from "@/components/ui/button/social-button";
import {
  faArrowRight,
  faEnvelopeOpen,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";

const PreSignIn = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const swiperRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue(0);

  const skipToConnect = () => {
    const connectSlideIndex = slides.findIndex(
      (slide) => slide.key === "connect"
    );
    if (connectSlideIndex !== -1) {
      swiperRef.current?.scrollTo({ index: connectSlideIndex });
    }
  };

  const onPressPagination = (index: number) => {
    swiperRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  return (
    <AppLayout>
      <Carousel
        ref={swiperRef} // Attach the ref to Swiper
        style={styles.wrapper}
        loop={false}
        width={Dimensions.get("window").width}
        data={slides}
        onProgressChange={(_, absoluteProgress) => {
          progress.value = absoluteProgress;
        }}
        withAnimation={{
          type: "timing",
          config: {},
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.key !== "connect" && (
              <View style={styles.skipButtonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    skipToConnect();
                  }}
                  buttonColor={Colors(theme).background}
                  textColor={Colors(theme).primary}
                >
                  Skip
                </Button>
              </View>
            )}
            <View style={styles.imageContainer}>
              <Image source={imageUrl(item.image)} style={styles.image} />
            </View>
            <Title style={[styles.title, { color: Colors(theme).primary }]}>
              {item.title}
            </Title>
            <Paragraph style={styles.paragraph}>{item.text}</Paragraph>
            {
              item.key !== "connect" && (
                <Pressable
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 15,
                    backgroundColor: Colors(theme).primary,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 5,
                    gap: 10,
                  }}
                  onPress={() => {
                    swiperRef.current?.next();
                  }}
                >
                  <Text
                    style={{
                      color: Colors(theme).white,
                      fontSize: 16,
                    }}
                  >
                    Next
                  </Text>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    size={16}
                    color={Colors(theme).white}
                  />
                </Pressable>
              )
            }
            {
              item.key === "connect" && (
                <View style={styles.socialContainer}>
                  <SocialButton
                    icon={faUserPlus}
                    label="Create New Account"
                    onPress={() => {
                      router.push("/create-new-account");
                    }}
                  />
                  <SocialButton
                    icon={faEnvelopeOpen}
                    label="Login"
                    onPress={() => {
                      router.push("/login");
                    }}
                  />
                </View>
              )
            }
          </View >
        )}
      />
      < Pagination.Basic
        progress={progress}
        data={slides}
        size={12}
        dotStyle={{
          borderRadius: 100,
          backgroundColor: Colors(theme).backdrop,
        }}
        activeDotStyle={{
          borderRadius: 100,
          overflow: "hidden",
          backgroundColor: Colors(theme).primary,
        }}
        containerStyle={
          [
            {
              gap: 5,
              marginBottom: 10,
            },
          ]}
        horizontal
        onPress={onPressPagination}
      />

      {error && <Text style={{ color: "red" }}>Error: {error}</Text>}
    </AppLayout >
  );
};

export default PreSignIn;
