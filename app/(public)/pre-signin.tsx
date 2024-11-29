import React, { useState, useRef } from "react";
import { View, Text, Image } from "react-native";
import Swiper from "react-native-swiper";
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
import { faEnvelopeOpen, faUserPlus } from "@fortawesome/free-solid-svg-icons";

const PreSignIn = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [error, setError] = useState<string | null>(null);
  const swiperRef = useRef<Swiper>(null); // Use ref for Swiper
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const skipToConnect = () => {
    // Calculate how many slides away the "connect" slide is
    const connectSlideIndex = slides.findIndex(
      (slide) => slide.key === "connect"
    );
    if (connectSlideIndex !== -1) {
      swiperRef.current?.scrollBy(connectSlideIndex);
    }
  };

  return (
    <AppLayout>
      <Swiper
        ref={swiperRef} // Attach the ref to Swiper
        style={styles.wrapper}
        dotStyle={styles.dotStyle}
        activeDotStyle={[
          styles.dotStyle,
          { backgroundColor: Colors(theme).primary },
        ]}
        paginationStyle={styles.pagination}
      >
        {
          slides.map((slide) => (
            <View style={styles.slide} key={slide.key}>
              {
                slide.key !== "connect" && (
                  <View
                    style={styles.skipButtonContainer}
                  >
                    <Button
                      mode="outlined"
                      onPress={() => {
                        skipToConnect();
                      }}
                    >
                      Skip
                    </Button>
                  </View>
                )
              }
              <View style={styles.imageContainer}>
                <Image source={imageUrl(slide.image)} style={styles.image} />
              </View>
              <Title style={[styles.title, { color: Colors(theme).primary }]}>
                {slide.title}
              </Title>
              <Paragraph style={styles.paragraph}>{slide.text}</Paragraph>
              {
                slide.key === "connect" && (
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
            </View>
          ))
        }
      </Swiper>

      {error && <Text style={{ color: "red" }}>Error: {error}</Text>}
    </AppLayout>
  );
};

export default PreSignIn;
