import BottomSheetActions from "@/components/BottomSheetActions";
import Colors from "@/constants/Colors";
import { DUMMY_MANAGER_CREDENTIALS } from "@/constants/Manager";
import { useAuthContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import fnStyles from "@/styles/onboarding/preference.styles";
import { AuthApp } from "@/utils/auth";
import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Checkbox, Button, IconButton } from "react-native-paper";
import { collection, doc, setDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";

const BrandPreferenceScreen = () => {
  // State for checkboxes
  const [promotionType, setPromotionType] = useState<any>({
    paid: false,
    unpaid: false,
    barter: false,
  });

  const [influencerType, setInfluencerType] = useState<any>({
    comedy: false,
    beauty: false,
    fashion: false,
  });

  const { firebaseSignIn } = useAuthContext();
  const theme = useTheme();
  const styles = fnStyles(theme);

  const handleSignUp = () => {
    firebaseSignIn(AuthApp.currentUser?.uid || "");
  };

  const [infoSheetVisible, setInfoSheetVisible] = useState(false);
  const [infoSheetType, setInfoSheetType] = useState<
    "influencerType" | "promotionType"
  >("promotionType");

  // Toggling Promotion Type
  const togglePromotionType = (type: any) => {
    setPromotionType((prev: any) => ({ ...prev, [type]: !prev[type] }));
  };

  // Toggling Influencer Type
  const toggleInfluencerType = (type: any) => {
    setInfluencerType((prev: any) => ({ ...prev, [type]: !prev[type] }));
  };
  const params = useLocalSearchParams();

  const handleSubmit = () => {
    try {
      const { brandId } = params;
      if (brandId) {
        //@ts-ignore
        const brandRef = doc(FirestoreDB, "brands", brandId);
        setDoc(
          brandRef,
          {
            preferences: {
              promotionType: Object.keys(promotionType).filter(
                (key) => promotionType[key]
              ),
              influencerCategory: Object.keys(influencerType).filter(
                (key) => influencerType[key]
              ),
            },
          },
          { merge: true }
        );
        setPromotionType({ paid: false, unpaid: false, barter: false });
        setInfluencerType({ comedy: false, beauty: false, fashion: false });
        router.push({
          pathname: "/(onboarding)/onboarding-get-started",
          params: { brandId },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        {/* Headline with Skip button on the right */}
        <View style={styles.headerContainer}>
          <Text style={styles.headline}>Brand Preferences</Text>
          <Button
            mode="contained"
            onPress={() => {
              handleSignUp();
            }}
          >
            Skip
          </Button>
        </View>

        {/* Promotion Type */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Promotion Type</Text>
          <IconButton
            icon="information-outline"
            onPress={() => {
              setInfoSheetType("promotionType");
              setInfoSheetVisible(true);
            }}
          />
        </View>
        <View style={styles.checkboxContainer}>
          <Checkbox.Item
            label="Paid"
            status={promotionType.paid ? "checked" : "unchecked"}
            onPress={() => togglePromotionType("paid")}
            color="#000"
            uncheckedColor="#000"
            labelStyle={styles.checkboxLabel}
          />
          <Checkbox.Item
            label="Unpaid"
            status={promotionType.unpaid ? "checked" : "unchecked"}
            onPress={() => togglePromotionType("unpaid")}
            color="#000"
            uncheckedColor="#000"
            labelStyle={styles.checkboxLabel}
          />
          <Checkbox.Item
            label="Barter"
            status={promotionType.barter ? "checked" : "unchecked"}
            onPress={() => togglePromotionType("barter")}
            color="#000"
            uncheckedColor="#000"
            labelStyle={styles.checkboxLabel}
          />
        </View>

        {/* Influencer Type */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Influencer Type</Text>
          <IconButton
            icon="information-outline"
            onPress={() => {
              setInfoSheetType("influencerType");
              setInfoSheetVisible(true);
            }}
          />
        </View>
        <View style={styles.checkboxContainer}>
          <Checkbox.Item
            label="Comedy"
            status={influencerType.comedy ? "checked" : "unchecked"}
            onPress={() => toggleInfluencerType("comedy")}
            color="#000"
            uncheckedColor="#000"
            labelStyle={styles.checkboxLabel}
          />
          <Checkbox.Item
            label="Beauty"
            status={influencerType.beauty ? "checked" : "unchecked"}
            onPress={() => toggleInfluencerType("beauty")}
            color="#000"
            uncheckedColor="#000"
            labelStyle={styles.checkboxLabel}
          />
          <Checkbox.Item
            label="Fashion"
            status={influencerType.fashion ? "checked" : "unchecked"}
            onPress={() => toggleInfluencerType("fashion")}
            color="#000"
            uncheckedColor="#000"
            labelStyle={styles.checkboxLabel}
          />
        </View>

        {/* Submit Button at the bottom */}
        <View style={styles.bottomButtonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
          >
            Submit
          </Button>
        </View>
      </View>
      <BottomSheetActions
        cardType={infoSheetType}
        isVisible={infoSheetVisible}
        snapPointsRange={["50%", "90%"]}
        onClose={() => {
          setInfoSheetVisible(false);
        }}
      />
    </AppLayout>
  );
};

export default BrandPreferenceScreen;
