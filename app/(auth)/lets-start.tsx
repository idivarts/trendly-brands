import Button from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import Colors from "@/shared-uis/constants/Colors";
import { imageUrl } from "@/utils/url";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
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
                                source={imageUrl(require("@/assets/images/icon2.png"))} // Replace with your local image
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </View>

                        {/* No Account Text */}
                        <Text style={styles.noAccountText}>Welcome to Trendly - for Brands</Text>
                        <Text
                            style={{
                                textAlign: "center",
                                color: Colors(theme).gray100,
                                marginBottom: 30,
                            }}
                        >
                            Welcome to the Trendly community! To get started, let us know which audience you belong to — are you a brand or an agency looking to collaborate with creators?
                        </Text>
                        <View style={[styles.buttonContainer, { display: "flex", alignContent: "stretch", gap: 16, alignItems: "stretch", width: 300, alignSelf: "center" }]}>
                            <Button onPress={() => router.push("/pre-signin")}>Join as Brand / Agency</Button>
                            <Button mode={"outlined"} onPress={() => {
                                if (Platform.OS === "web")
                                    window.open(CREATORS_FE_URL, "_blank");
                                else
                                    router.push("/wrong-app")
                            }}>Join as Influencer</Button>
                            {/* <InstagramLoginButton />
              <FacebookLoginButton /> */}
                        </View>
                    </View>
                </View>

                {/* Buttons */}

            </View>
        </AppLayout>
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
        height: 200,
        width: 200,
        borderRadius: 40,
        marginBottom: 40,
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
