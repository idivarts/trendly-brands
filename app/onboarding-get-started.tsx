import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import fnStyles from "@/styles/onboarding/get-started.styles";
import { DUMMY_MANAGER_CREDENTIALS } from "@/constants/Manager";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { View, Text, StyleSheet, Button, TouchableOpacity } from "react-native";
import { Menu, Provider } from "react-native-paper";
import { AuthApp } from "@/utils/auth";

const GetStartedScreen = () => {
  const [hearAboutUs, setHearAboutUs] = useState("");
  const [useFor, setUseFor] = useState("");
  const [volumeOfCollaboration, setVolumeOfCollaboration] = useState("");
  const { firebaseSignIn } = useAuthContext();
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

  const handleSignUp = () => {
    firebaseSignIn(AuthApp.currentUser?.uid || "");
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        {/* Heading */}
        <View style={styles.headerContainer}>
          <Text style={styles.headline}>Get Started</Text>
          <Button
            title="Skip"
            onPress={() => {
              handleSignUp();
            }}
            color={Colors(theme).text}
          />
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
          {/* <Button
            title="Take me in"
            onPress={() => {
              signIn("testuser@gmail.com", "password");
            }}
            color="#000"
          /> */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              handleSignUp();
            }}
          >
            <Text style={styles.buttonText}>Take me in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppLayout>
  );
};

export default GetStartedScreen;