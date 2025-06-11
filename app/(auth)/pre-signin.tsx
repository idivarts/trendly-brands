import TermsAndCondition from "@/components/TermsAndCondition";
import BottomSheetScrollContainer from "@/components/ui/bottom-sheet/BottomSheetWithScroll";
import Button from "@/components/ui/button";
import SocialButton from "@/components/ui/button/social-button";
import Colors from "@/constants/Colors";
import { slides } from "@/constants/Slides";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import stylesFn from "@/styles/tab1.styles";
import { imageUrl } from "@/utils/url";
import { useAppleLogin } from "@/utils/use-apple-login";
import { useGoogleLogin } from "@/utils/use-google-login";
import { faApple, faGoogle } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowRight,
  faMailBulk
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";

const PreSignIn = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [error, setError] = useState<string | null>(null);
  const [termsCondition, setTermsCondition] = useState(false);
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  const swiperRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue(0);

  const skipToConnect = () => {
    const connectSlideIndex = slides.findIndex(
      (slide) => slide.key === "connect"
    );
    if (connectSlideIndex !== -1) {
      swiperRef.current?.scrollTo({
        count: connectSlideIndex - progress.value,
        animated: true,
      });
    }
  };

  const onPressPagination = (index: number) => {
    swiperRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  const { xl } = useBreakpoints();
  const { googleLogin } = useGoogleLogin(setLoading, setError)
  const { appleLogin } = useAppleLogin(setLoading, setError)
  return (
    <AppLayout>
      <View style={{ flex: 1, alignSelf: "center" }}>
        <Carousel
          ref={swiperRef} // Attach the ref to Swiper
          // style={styles.wrapper}
          loop={false}
          width={xl ? 800 : Dimensions.get("window").width}
          height={Dimensions.get("window").height - 36 * Dimensions.get("window").scale}
          pagingEnabled
          data={slides}
          onProgressChange={(_, absoluteProgress) => {
            runOnJS((value: number) => {
              progress.value = value;
            })(absoluteProgress);
          }}
          withAnimation={{
            type: "timing",
            config: {},
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.imageContainer}>
                <Image source={imageUrl(item.image)} style={styles.image} />
              </View>
              <Text style={[styles.title, { color: Colors(theme).primary }]}>
                {item.title}
              </Text>
              <Text style={styles.paragraph}>{item.text}</Text>
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
              {item.key !== "connect" && (
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
              )}
              {item.key === "connect" && (
                <View style={styles.socialContainer}>
                  {Platform.OS != "ios" &&
                    <SocialButton
                      icon={faGoogle}
                      label="Continue with Google"
                      onPress={() => {
                        // router.push("/login");
                        googleLogin()
                      }}
                    />}
                  {Platform.OS == "ios" &&
                    <SocialButton
                      icon={faApple}
                      label="Continue with Apple"
                      onPress={() => {
                        appleLogin()
                      }}
                    />}
                  <SocialButton
                    icon={faMailBulk}
                    label="Continue with Email/Password"
                    onPress={() => {
                      router.push("/create-new-account");
                    }}
                  />
                </View>
              )}

              {item.key === "connect" && (
                <View style={{ marginTop: 40, paddingHorizontal: 20 }}>
                  <Text style={{ fontSize: 12, textAlign: "center", color: Colors(theme).text }}>
                    By proceeding to signup, you agree to{" "}
                    <Text
                      style={{ color: Colors(theme).primary, textDecorationLine: "underline" }}
                      onPress={() => setTermsCondition(true)}
                    >
                      Terms & Condition (EULA)
                    </Text>{" "}
                    of Trendly
                  </Text>
                </View>
              )}

              {error && (
                <Text style={{ color: "red", marginTop: 10, textAlign: "center" }}>
                  {error}
                </Text>
              )}
            </View>
          )}
        />
        <Pagination.Basic
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
          containerStyle={[
            {
              gap: 5,
              marginBottom: 10,
            },
          ]}
          horizontal
          onPress={onPressPagination}
        />
      </View>
      <BottomSheetScrollContainer
        isVisible={termsCondition}
        snapPointsRange={["85%", "85%"]}
        onClose={() => {
          setTermsCondition(false)
        }}>
        <TermsAndCondition />
      </BottomSheetScrollContainer>
      {/* {error && <Text style={{ color: "red" }}>Error: {error}</Text>} */}
    </AppLayout>
  );
};

export default PreSignIn;
