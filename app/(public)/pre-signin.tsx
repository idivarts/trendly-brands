import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Platform } from "react-native";
import Swiper from "react-native-swiper";
import { Title, Paragraph } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import stylesFn from "@/styles/tab1.styles";
import { useTheme } from "@react-navigation/native";
import AppLayout from "@/layouts/app-layout";
import { slides } from "@/constants/Slides";
import Colors from "@/constants/Themes/Colors";
import { useRouter } from "expo-router";

const PreSignIn = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [error, setError] = useState<string | null>(null);
  const swiperRef = useRef<Swiper>(null); // Use ref for Swiper
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const renderSocialButton = (
    iconName: string,
    label: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.socialButton} onPress={onPress}>
      <Ionicons
        name={iconName as any}
        size={24}
        color={Colors(theme).text}
        style={styles.icon}
      />
      <Text style={styles.socialButtonText}>{label}</Text>
    </TouchableOpacity>
  );

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
        {slides.map((slide, index) => (
          <View style={styles.slide} key={slide.key}>
            {slide.key !== "connect" && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipToConnect} // Navigate to "connect" slide
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
            <View style={styles.imageContainer}>
              <Image source={{ uri: slide.image }} style={styles.image} />
            </View>
            <Title style={[styles.title, { color: Colors(theme).primary }]}>
              {slide.title}
            </Title>
            <Paragraph style={styles.paragraph}>{slide.text}</Paragraph>
            {slide.key === "connect" && (
              <View style={styles.socialContainer}>
                {/* {renderSocialButton(
                  "logo-facebook",
                  "Login with Facebook",
                  () => {}
                )} */}
                {renderSocialButton("person-add", "Create New Account", () => {
                  router.push("/create-new-account");
                })}
                {renderSocialButton("mail-open", "Login", () => {
                  router.push("/login");
                })}
              </View>
            )}
          </View>
        ))}
      </Swiper>

      {error && <Text style={{ color: "red" }}>Error: {error}</Text>}
    </AppLayout>
  );
};

export default PreSignIn;
