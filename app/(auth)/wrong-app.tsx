import Button from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_APPSTORE_URL, CREATORS_FE_URL } from "@/shared-constants/app";
import Colors from "@/shared-uis/constants/Colors";
import { imageUrl } from "@/utils/url";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

const TrendlyScreen = () => {
  // const { socials } = useSocialContext();
  const theme = useTheme();

  return (
    <AppLayout withWebPadding={true}>
      <View
        style={{
          flex: 1,
          backgroundColor: Colors(theme).background,
          padding: 16,
          justifyContent: "space-between",
        }}
      >

        <View style={{ flex: 1, justifyContent: "center" }}>
          {/* Illustration */}
          <View>
            <View style={styles.imageContainer}>
              <Image
                source={imageUrl(require("@/assets/images/wrong-app.png"))} // Replace with your local image
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* No Account Text */}
            <Text style={styles.noAccountText}>Oops! you are on wrong app!</Text>
            <Text
              style={{
                textAlign: "center",
                color: Colors(theme).gray100,
                marginBottom: 30,
              }}
            >
              If you're a creator, please download the Trendly app from the App Store or continue using the web version.
            </Text>
            <View style={[styles.buttonContainer, { display: "flex", alignContent: "stretch", gap: 16, alignItems: "stretch", width: 300, alignSelf: "center" }]}>
              <Button onPress={() => {
                Linking.openURL(CREATORS_APPSTORE_URL)
              }}> Download on AppStore</Button>
              <Button mode={"outlined"} onPress={() => Linking.openURL(CREATORS_FE_URL)}>Open on Web</Button>
              {/* <InstagramLoginButton />
              <FacebookLoginButton /> */}
            </View>
          </View>
        </View>

        {/* Buttons */}

      </View>
    </AppLayout >
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  imageContainer: {
    alignItems: "center",
    // marginVertical: 0,
  },
  image: {
    height: 250,
    width: 250,
    marginBottom: 40
  },
  noAccountText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  button: {
    marginVertical: 10,
    paddingVertical: 5,
  },
});

export default TrendlyScreen;
