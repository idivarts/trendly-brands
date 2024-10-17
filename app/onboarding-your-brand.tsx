import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { TextInput, Button, Icon } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
// import {
//   AutocompleteDropdown,
//   AutocompleteDropdownContextProvider,
// } from "react-native-autocomplete-dropdown";
import { router } from "expo-router";
import {
  AutocompleteDropdown,
  AutocompleteDropdownContextProvider,
} from "react-native-autocomplete-dropdown";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import fnStyles from "@/styles/onboarding/brand.styles";
import Colors from "@/constants/Colors";

const OnboardingScreen = () => {
  const [brandName, setBrandName] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [image, setImage] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const theme = useTheme();
  const styles = fnStyles(theme);

  const roles = ["CEO", "Manager", "Developer", "Designer", "Marketing"];
  const industries = ["Automotive", "Technology", "Finance", "Health", "Other"];

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

  const handleSubmit = () => {
    const formData = {
      brandName,
      role,
      industry,
      website,
      image,
    };
    router.navigate("onboarding-brand-preference");
    console.log(formData);
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        {/* Headline */}
        <Text style={styles.headline}>Onboarding</Text>

        {/* Logo Image Upload */}
        <Button
          mode="outlined"
          onPress={pickImage}
          style={styles.uploadButton}
          textColor={Colors(theme).text}
        >
          {image ? "Change Image" : "Upload Image"}
        </Button>
        {image && <Image source={{ uri: image }} style={styles.logoImage} />}

        {/* Brand Name */}
        <TextInput
          label="Brand Name"
          value={brandName}
          onChangeText={setBrandName}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { text: "#000", placeholder: "#000" } }}
        />

        {/* Role Autocomplete */}
        <TextInput
          label="Your Role at Company"
          value={role}
          onChangeText={setRole}
          mode="outlined"
          style={styles.input}
          placeholder="Type or choose your role"
          theme={{ colors: { text: "#000", placeholder: "#000" } }}
        />

        {/* Industry Dropdown */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Industry</Text>
          {/* <AutocompleteDropdown
            inputContainerStyle={{
              borderWidth: 0.7,
              borderColor: "#000",
              backgroundColor: "#fff",
              borderRadius: 5,
            }}
            suggestionsListContainerStyle={{
              borderWidth: 1,
              borderColor: "#000",
              borderRadius: 5,
            }}
            onSelectItem={(item) => console.log(item)}
            direction="down"
            dataSet={[
              //id and title
              { id: "1", title: "Automotive" },
              { id: "2", title: "Technology" },
              { id: "3", title: "Finance" },
              { id: "4", title: "Health" },
              { id: "5", title: "Other" },
            ]}
          /> */}
        </View>

        {/* Company Website */}
        <TextInput
          label="Company Website"
          value={website}
          onChangeText={setWebsite}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { text: "#000", placeholder: "#000" } }}
        />

        {/* Submit Button */}
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
