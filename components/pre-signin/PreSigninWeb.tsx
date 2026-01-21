import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { imageUrl } from "@/utils/url";
import { useAppleLogin } from "@/utils/use-apple-login";
import { useGoogleLogin } from "@/utils/use-google-login";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import TermsAndCondition from "../TermsAndCondition";
import BottomSheetScrollContainer from "../ui/bottom-sheet/BottomSheetWithScroll";
import SocialButton from "../ui/button/social-button";

const PreSignInWeb = () => {
    const theme = useTheme();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false)
    const router = useRouter();
    const [termsCondition, setTermsCondition] = useState(false);


    const { xl } = useBreakpoints();
    const { googleLogin } = useGoogleLogin(setLoading, setError)
    const { appleLogin } = useAppleLogin(setLoading, setError)

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
                <View style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 50 }}>
                    {/* Illustration */}
                    <View>
                        <View style={styles.imageContainer}>
                            <Image
                                source={imageUrl(require("@/assets/images/design3.png"))} // Replace with your local image
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                    <View style={{ maxWidth: 500, alignItems: "flex-start" }}>
                        {/* No Account Text */}
                        <Text style={styles.noAccountText}>Lets Get Started</Text>
                        <Text
                            style={{
                                fontSize: 18,
                                lineHeight: 28,
                                marginVertical: 16,
                                // textAlign: "center",
                                color: Colors(theme).gray100,
                            }}
                        >
                            Sign up to start posting collaborations or log in to manage your existing campaigns.
                        </Text>
                        <View style={[styles.buttonContainer, { display: "flex", alignContent: "stretch", gap: 16, alignItems: "stretch", width: 300, alignSelf: "flex-start" }]}>
                            <SocialButton
                                icon={faGoogle}
                                label="Continue with Google"
                                customStyles={{ marginLeft: 0 }}
                                onPress={() => {
                                    // router.push("/login");
                                    googleLogin()
                                }}
                            />
                            <SocialButton
                                icon={faEnvelope}
                                label="Continue with Email"
                                customStyles={{ marginLeft: 0 }}
                                onPress={() => {
                                    router.push("/create-new-account");
                                }}
                            />
                        </View>
                        <View style={{ marginTop: 40 }}>
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
                    </View>
                </View>
            </View>
            <BottomSheetScrollContainer
                isVisible={termsCondition}
                snapPointsRange={["85%", "85%"]}
                onClose={() => {
                    setTermsCondition(false)
                }}>
                <TermsAndCondition />
            </BottomSheetScrollContainer>

            {/* Buttons */}

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
        height: 300,
        width: 300,
        margin: 70,
        borderRadius: 40,
        // marginBottom: 40,
    },
    noAccountText: {
        textAlign: "center",
        fontSize: 32,
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

export default PreSignInWeb;