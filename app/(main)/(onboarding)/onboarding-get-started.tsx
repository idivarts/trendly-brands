import Button from "@/components/ui/button";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import fnStyles from "@/styles/onboarding/get-started.styles";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Menu } from "react-native-paper";

const GetStartedScreen = () => {
    const [hearAboutUs, setHearAboutUs] = useState("");
    const [useFor, setUseFor] = useState("");
    const [volumeOfCollaboration, setVolumeOfCollaboration] = useState("");
    const { setSession } = useAuthContext();
    const theme = useTheme();
    const styles = fnStyles(theme);

    const [visible1, setVisible1] = useState(false);
    const [visible2, setVisible2] = useState(false);
    const [visible3, setVisible3] = useState(false);

    const openMenu1 = () => setVisible1(true);
    const closeMenu1 = () => setVisible1(false);

    const openMenu2 = () => setVisible2(true);
    const closeMenu2 = () => setVisible2(false);

    const openMenu3 = () => setVisible3(true);
    const closeMenu3 = () => setVisible3(false);

    const {
        brandId,
        firstBrand,
    } = useLocalSearchParams();

    const {
        setSelectedBrand,
    } = useBrandContext();

    const handleSkip = () => {
        setSession(AuthApp.currentUser?.uid || "");
        router.replace("/discover");
        Toaster.success(firstBrand === "true" ? "Signed In Successfully!" : "Brand Created Successfully!");
    };

    const handleSubmit = async () => {
        try {
            if (brandId) {
                //@ts-ignore
                const brandRef = doc(FirestoreDB, "brands", brandId);

                await setDoc(
                    brandRef,
                    {
                        survey: {
                            source: hearAboutUs,
                            purpose: useFor,
                            collaborationValue: volumeOfCollaboration,
                        },
                    },
                    { merge: true }
                )

                const brandData = await getDoc(brandRef);

                setSelectedBrand({
                    ...(brandData.data() as Brand),
                    id: brandRef.id,
                });

                router.replace("/discover");
                Toaster.success(firstBrand === "true" ? "Signed In Successfully!" : "Brand Created Successfully!");
            }
        } catch (error) {
            Console.error(error);
        }
    };
    const htmlScript = `<script src="https://js.hsforms.net/forms/embed/48930010.js" defer></script>
    <div class="hs-form-frame" data-region="na1" data-form-id="83acd98c-f2a8-44ff-b528-9291d6e26349" data-portal-id="48930010"></div>`


    return (
        <AppLayout withWebPadding={true}>
            <View style={styles.container}>
                {/* Heading */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headline}>Get Started</Text>
                    <Button
                        mode="contained"
                        onPress={() => {
                            handleSkip();
                        }}
                    >
                        Skip
                    </Button>
                </View>

                {/* Question 1: Where did you hear about us */}
                <Text style={styles.question}>Where did you hear about us</Text>
                <Menu
                    visible={visible1}
                    onDismiss={closeMenu1}
                    contentStyle={{ backgroundColor: "#fff" }}
                    anchor={
                        <TouchableOpacity onPress={openMenu1} style={styles.dropdown}>
                            <Text style={{ color: Colors(theme).text }}>
                                {hearAboutUs ? hearAboutUs : "Select Option"}
                            </Text>
                        </TouchableOpacity>
                    }
                >
                    <Menu.Item
                        onPress={() => {
                            setHearAboutUs("Social Media");
                            closeMenu1();
                        }}
                        title="Social Media"
                    />
                    <Menu.Item
                        onPress={() => {
                            setHearAboutUs("Friends");
                            closeMenu1();
                        }}
                        title="Friends"
                    />
                    <Menu.Item
                        onPress={() => {
                            setHearAboutUs("Ads");
                            closeMenu1();
                        }}
                        title="Ads"
                    />
                </Menu>

                {/* Question 2: What will you use Trendly for */}
                <Text style={styles.question}>What will you use Trendly for?</Text>
                <Menu
                    visible={visible2}
                    onDismiss={closeMenu2}
                    contentStyle={{ backgroundColor: "#fff" }}
                    anchor={
                        <TouchableOpacity onPress={openMenu2} style={styles.dropdown}>
                            <Text style={{ color: Colors(theme).text }}>
                                {useFor ? useFor : "Select Option"}
                            </Text>
                        </TouchableOpacity>
                    }
                >
                    <Menu.Item
                        onPress={() => {
                            setUseFor("Marketing");
                            closeMenu2();
                        }}
                        title="Marketing"
                    />
                    <Menu.Item
                        onPress={() => {
                            setUseFor("Content Creation");
                            closeMenu2();
                        }}
                        title="Content Creation"
                    />
                    <Menu.Item
                        onPress={() => {
                            setUseFor("Other");
                            closeMenu2();
                        }}
                        title="Other"
                    />
                </Menu>

                {/* Question 3: What is the volume of collaborations you wish to post */}
                <Text style={styles.question}>
                    What is the volume of collaborations you wish to post?
                </Text>
                <Menu
                    visible={visible3}
                    onDismiss={closeMenu3}
                    contentStyle={{ backgroundColor: "#fff" }}
                    anchor={
                        <TouchableOpacity onPress={openMenu3} style={styles.dropdown}>
                            <Text style={{ color: Colors(theme).text }}>
                                {volumeOfCollaboration
                                    ? volumeOfCollaboration
                                    : "Select Option"}
                            </Text>
                        </TouchableOpacity>
                    }
                >
                    <Menu.Item
                        onPress={() => {
                            setVolumeOfCollaboration("Low");
                            closeMenu3();
                        }}
                        title="Low"
                    />
                    <Menu.Item
                        onPress={() => {
                            setVolumeOfCollaboration("Medium");
                            closeMenu3();
                        }}
                        title="Medium"
                    />
                    <Menu.Item
                        onPress={() => {
                            setVolumeOfCollaboration("High");
                            closeMenu3();
                        }}
                        title="High"
                    />
                </Menu>

                {/* Footer buttons */}
                <View style={styles.footer}>
                    <Button
                        mode="contained"
                        onPress={() => {
                            handleSubmit();
                        }}
                        style={{
                            width: "100%",
                        }}
                    >
                        {firstBrand === "true" ? "Take me in" : "Submit"}
                    </Button>
                </View>
            </View>
        </AppLayout>
    );
};

export default GetStartedScreen;
