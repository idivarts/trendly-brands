import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
} from "react-native";
import { TextInput, Button, IconButton } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import AutocompleteInput from "react-native-autocomplete-input";
import { router, useLocalSearchParams } from "expo-router";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import fnStyles from "@/styles/onboarding/brand.styles";
import { Industries as industries } from "@/constants/Industries";
import { roles } from "@/constants/Roles";
import { AuthApp } from "@/utils/auth";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/constants/Colors";
import { useFirebaseStorageContext } from "@/contexts";

const OnboardingScreen = () => {
  const [brandName, setBrandName] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [image, setImage] = useState("");
  const [filteredRoles, setFilteredRoles] = useState<any[]>([]);
  const [filteredIndustries, setFilteredIndustries] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const styles = fnStyles(theme);
  const {
    firstBrand,
  } = useLocalSearchParams();
  const {
    uploadImageBytes,
  } = useFirebaseStorageContext();

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
      setIsSubmitting(true);
      const user = AuthApp.currentUser;
      if (!brandName || !role || !industry || !website) {
        Toaster.error("Please fill in all fields.");
        setIsSubmitting(false);
        return;
      }

      let imageUrl = "";
      if (image) {
        const blob = await fetch(image).then((res) => res.blob());
        imageUrl = await uploadImageBytes(blob, `brands/${brandName}-${Date.now()}`);
      }

      if (user) {
        const colRef = collection(FirestoreDB, "brands");

        let brandData = {
          name: brandName,
          image: imageUrl,
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

        setIsSubmitting(false);
        router.navigate({
          pathname: "/(onboarding)/onboarding-brand-preference",
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
          style={styles.headlineContainer}
        >
          {
            firstBrand !== "true" && (
              <IconButton
                style={styles.backButton}
                icon="arrow-left"
                onPress={() => router.back()}
                size={24}
              />
            )
          }
          <Text style={styles.headline}>
            {firstBrand === "true" ? "Onboarding" : "Create New Brand"}
          </Text>
        </View>
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
          theme={{ colors: { primary: Colors(theme).text } }}
        />

        <View
          style={[
            styles.autocompleteContainer,
            activeDropdown === "role" ? { zIndex: 2 } : { zIndex: 1 },
          ]}
        >
          <AutocompleteInput
            data={filteredRoles}
            value={role}
            onChangeText={filterRoles}
            onFocus={() => setActiveDropdown("role")}
            placeholder="Your Role at Company"
            placeholderTextColor={Colors(theme).text}
            flatListProps={{
              keyboardShouldPersistTaps: "always",
              keyExtractor: (_, idx) => idx.toString(),
              renderItem: ({ item }) => (
                <Pressable
                  style={{
                    backgroundColor: Colors(theme).background,
                  }}
                  onPress={() => {
                    setRole(item);
                    setFilteredRoles([]);
                    setActiveDropdown(null);
                  }}
                >
                  <Text style={styles.itemText}>{item}</Text>
                </Pressable>
              ),
            }}
            style={{
              backgroundColor: Colors(theme).inputBackground,
              color: Colors(theme).text,
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
            value={industry}
            onChangeText={filterIndustries}
            onFocus={() => setActiveDropdown("industry")}
            placeholder="Select Industry"
            placeholderTextColor={Colors(theme).text}
            flatListProps={{
              keyboardShouldPersistTaps: "always",
              keyExtractor: (_, idx) => idx.toString(),
              renderItem: ({ item }) => (
                <Pressable
                  style={{
                    backgroundColor: Colors(theme).background,
                  }}
                  onPress={() => {
                    setIndustry(item);
                    setFilteredIndustries([]);
                    setActiveDropdown(null);
                  }}
                >
                  <Text style={styles.itemText}>{item}</Text>
                </Pressable>
              ),
            }}
            style={{
              backgroundColor: Colors(theme).inputBackground,
              color: Colors(theme).text,
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
          theme={{ colors: { primary: Colors(theme).text } }}
        />

        <Button
          loading={isSubmitting}
          mode="contained"
          onPress={handleSubmit}
        >
          Submit
        </Button>
      </View>
    </AppLayout>
  );
};

export default OnboardingScreen;
