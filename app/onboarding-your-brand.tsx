import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import AutocompleteInput from "react-native-autocomplete-input";
import { router } from "expo-router";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import fnStyles from "@/styles/onboarding/brand.styles";
import Colors from "@/constants/Colors";
import { Industries as industries } from "@/constants/Industries";
import { roles } from "@/constants/Roles";
import { AuthApp } from "@/utils/auth";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { StorageApp } from "@/utils/firebase-storage";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Toast from "react-native-toast-message";
import Toaster from "@/shared-uis/components/toaster/Toaster";

const OnboardingScreen = () => {
  const [brandName, setBrandName] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [image, setImage] = useState("");
  const [filteredRoles, setFilteredRoles] = useState<any[]>([]);
  const [filteredIndustries, setFilteredIndustries] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<any>(null);
  const theme = useTheme();
  const styles = fnStyles(theme);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const filterRoles = useCallback((text: string) => {
    setRole(text);
    const filtered = roles.filter((item) =>
      item.toLowerCase().startsWith(text.toLowerCase())
    );
    setFilteredRoles(filtered);
    setActiveDropdown("role");
  }, []);

  const filterIndustries = useCallback((text: string) => {
    setIndustry(text);
    const filtered = industries.filter((item) =>
      item.toLowerCase().startsWith(text.toLowerCase())
    );
    setFilteredIndustries(filtered);
    setActiveDropdown("industry");
  }, []);

  const handleSubmit = async () => {
    try {
      const user = AuthApp.currentUser;
      if (!brandName || !role || !industry || !website) {
        Toaster.error("Please fill in all fields.");
        return;
      }
      if (user) {
        const colRef = collection(FirestoreDB, "brands");

        let brandData = {
          name: brandName,
          image: "",
          profile: {
            industry,
            website,
          },
        };

        const docRef = await addDoc(colRef, brandData);

        const managerRef = doc(
          FirestoreDB,
          "brands",
          docRef.id,
          "members",
          user.uid
        );

        await setDoc(managerRef, {
          managerId: user.uid,
          role,
        });

        router.navigate({
          pathname: "/onboarding-brand-preference",
          params: { brandId: docRef.id },
        });
      }
    } catch (error) {
      console.error("Error creating brand: ", error);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <View
          style={{
            zIndex: 10,
          }}
        >
          <Toast />
        </View>
        <Text style={styles.headline}>Onboarding</Text>
        <Button
          mode="outlined"
          onPress={pickImage}
          style={styles.uploadButton}
          textColor={Colors(theme).text}
        >
          {image ? "Change Image" : "Upload Image"}
        </Button>
        {image && <Image source={{ uri: image }} style={styles.logoImage} />}

        <TextInput
          label="Brand Name"
          value={brandName}
          onChangeText={setBrandName}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { text: "#000", placeholder: "#000" } }}
        />

        <View
          style={[
            styles.autocompleteContainer,
            activeDropdown === "role" ? { zIndex: 2 } : { zIndex: 1 },
          ]}
        >
          <AutocompleteInput
            data={filteredRoles}
            defaultValue={role}
            onChangeText={filterRoles}
            onFocus={() => setActiveDropdown("role")}
            placeholder="Your Role at Company"
            flatListProps={{
              keyboardShouldPersistTaps: "always",
              keyExtractor: (_, idx) => idx.toString(),
              renderItem: ({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setRole(item);
                    setFilteredRoles([]);
                    setActiveDropdown(null);
                  }}
                >
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              ),
            }}
            inputContainerStyle={styles.autocompleteInputContainer}
            listContainerStyle={styles.autocompleteListContainer}
          />
        </View>

        <View
          style={[
            styles.autocompleteContainer,
            activeDropdown === "industry" ? { zIndex: 2 } : { zIndex: 1 },
          ]}
        >
          <AutocompleteInput
            data={filteredIndustries}
            defaultValue={industry}
            onChangeText={filterIndustries}
            onFocus={() => setActiveDropdown("industry")}
            placeholder="Select Industry"
            flatListProps={{
              keyboardShouldPersistTaps: "always",
              keyExtractor: (_, idx) => idx.toString(),
              renderItem: ({ item }) => (
                <TouchableWithoutFeedback
                  onPress={() => {
                    setIndustry(item);
                    setFilteredIndustries([]);
                    setActiveDropdown(null);
                  }}
                >
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableWithoutFeedback>
              ),
            }}
            inputContainerStyle={styles.autocompleteInputContainer}
            listContainerStyle={styles.autocompleteListContainer}
          />
        </View>

        <TextInput
          label="Company Website"
          value={website}
          onChangeText={setWebsite}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { text: "#000", placeholder: "#000" } }}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          buttonColor={Colors(theme).primary}
          textColor={Colors(theme).text}
        >
          Submit
        </Button>
      </View>
    </AppLayout>
  );
};

export default OnboardingScreen;
