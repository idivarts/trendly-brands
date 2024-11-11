import AppLayout from "@/layouts/app-layout";
import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  IconButton,
  RadioButton,
  Modal,
  Portal,
  PaperProvider,
} from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { useTheme } from "@react-navigation/native";
import { addDoc, collection } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Toast from "react-native-toast-message";
import { useBrandContext } from "@/contexts/brand-context.provider";
import Colors from "@/constants/Colors";
import { router } from "expo-router";
import BackButton from "@/components/ui/back-button/BackButton";
import { Ionicons } from "@expo/vector-icons";

const CreateCollaborationScreen = () => {
  const [collaborationName, setCollaborationName] = useState("");
  const [aboutCollab, setAboutCollab] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [numInfluencers, setNumInfluencers] = useState(1);
  const [promotionType, setPromotionType] = useState("");
  const [collabType, setCollabType] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [location, setLocation] = useState("Remote");
  const [links, setLinks] = useState<any[]>([]);
  const [screen, setScreen] = useState(1);
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const { selectedBrand } = useBrandContext();
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const addLink = () => {
    setLinks([...links, { name: newLinkName, url: newLinkUrl }]);
    setNewLinkName("");
    setNewLinkUrl("");
    setIsModalVisible(false);
  };

  const submitCollaboration = async () => {
    try {
      if (!AuthApp.currentUser) {
        console.error("User not logged in");
      }

      if (
        !collaborationName ||
        !aboutCollab ||
        !budgetMin ||
        !budgetMax ||
        !promotionType ||
        !collabType ||
        !numInfluencers ||
        !platform ||
        !location
      ) {
        Toaster.error("Please fill all fields");
        return;
      }

      const collabRef = collection(FirestoreDB, "collaborations");
      const docRef = await addDoc(collabRef, {
        name: collaborationName,
        brandId: selectedBrand ? selectedBrand.id : "",
        managerId: AuthApp.currentUser?.uid,
        description: aboutCollab,
        timeStamp: Date.now(),
        budget: {
          min: budgetMin,
          max: budgetMax,
        },
        promotionType,
        collaborationType: collabType,
        numberOfInfluencersNeeded: numInfluencers,
        platform,
        location: {
          type: location,
          ...(location === "Physical" && {
            name: "locationName",
            latlong: {
              lat: mapRegion.latitude,
              long: mapRegion.longitude,
            },
          }),
        },
        externalLinks: links,
        status: "active",
      }).then(() => {
        setScreen(3);
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (screen === 1) {
    return (
      <AppLayout>
        <View
          style={{
            zIndex: 1000,
          }}
        >
          <Toast />
        </View>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{
            paddingVertical: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
              gap: 16,
            }}
          >
            {Platform.OS === "web" && (
              <TouchableOpacity onPress={() => router.push("/collaborations")}>
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
            )}
            <Title style={styles.title}>Create a Collaboration</Title>
          </View>
          <TextInput
            label="Collaboration Name"
            value={collaborationName}
            onChangeText={(text) => setCollaborationName(text)}
            style={styles.input}
            textColor={Colors(theme).text}
            theme={{
              colors: {
                primary: Colors(theme).primary,
                placeholder: Colors(theme).text,
                text: Colors(theme).text,
              },
            }}
          />
          <TextInput
            label="About this Collaboration"
            value={aboutCollab}
            onChangeText={(text) => setAboutCollab(text)}
            multiline
            textColor={Colors(theme).text}
            style={styles.input}
          />
          <View style={styles.budgetContainer}>
            <TextInput
              label="Budget Min"
              value={budgetMin}
              onChangeText={(text) => setBudgetMin(text)}
              style={styles.budgetInput}
              textColor={Colors(theme).text}
            />
            <TextInput
              label="Budget Max"
              value={budgetMax}
              onChangeText={(text) => setBudgetMax(text)}
              textColor={Colors(theme).text}
              style={styles.budgetInput}
            />
          </View>
          <Paragraph style={styles.paragraph}>
            Number of Influencers Involved
          </Paragraph>
          <View style={styles.counter}>
            <IconButton
              icon="minus"
              onPress={() => setNumInfluencers(Math.max(1, numInfluencers - 1))}
            />
            <Paragraph style={styles.paragraph}>{numInfluencers}</Paragraph>
            <IconButton
              icon="plus"
              onPress={() => setNumInfluencers(numInfluencers + 1)}
            />
          </View>
          <Paragraph style={styles.paragraph}>Promotion Type</Paragraph>
          <RadioButton.Group
            onValueChange={(newValue) => setPromotionType(newValue)}
            value={promotionType}
          >
            <RadioButton.Item
              label="Type 1"
              value="type1"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
            <RadioButton.Item
              label="Type 2"
              value="type2"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
            <RadioButton.Item
              label="Type 3"
              value="type3"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
          </RadioButton.Group>
          <Paragraph style={styles.paragraph}>Collaboration Type</Paragraph>
          <RadioButton.Group
            onValueChange={(newValue) => setCollabType(newValue)}
            value={collabType}
          >
            <RadioButton.Item
              label="Collab 1"
              value="collab1"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
            <RadioButton.Item
              label="Collab 2"
              value="collab2"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
            <RadioButton.Item
              label="Collab 3"
              value="collab3"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
          </RadioButton.Group>
          <Paragraph style={styles.paragraph}>Platform</Paragraph>
          <RadioButton.Group
            onValueChange={(newValue) => setPlatform(newValue)}
            value={platform}
          >
            <RadioButton.Item
              label="Instagram"
              value="Instagram"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
            <RadioButton.Item
              label="YouTube"
              value="YouTube"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
          </RadioButton.Group>
          <Button
            mode="contained"
            onPress={() => {
              if (
                !collaborationName ||
                !aboutCollab ||
                !budgetMin ||
                !budgetMax ||
                !numInfluencers ||
                !promotionType ||
                !collabType ||
                !platform
              ) {
                Toaster.error("Please fill all fields");
                return;
              }
              setScreen(2);
            }}
          >
            Next
          </Button>
        </ScrollView>
      </AppLayout>
    );
  }

  if (screen == 2) {
    return (
      <AppLayout>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View
            style={{
              zIndex: 1000,
            }}
          >
            <Toast />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <IconButton icon="arrow-left" onPress={() => setScreen(1)} />
            <Title style={styles.title}>Create a Collaboration</Title>
          </View>

          <Paragraph style={styles.paragraph}>Location</Paragraph>
          <RadioButton.Group
            onValueChange={(newValue) => setLocation(newValue)}
            value={location}
          >
            <RadioButton.Item
              label="Remote"
              value="Remote"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
            <RadioButton.Item
              label="Physical"
              value="Physical"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
          </RadioButton.Group>

          {location === "Physical" && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={(region) => setMapRegion(region)}
              >
                <Marker coordinate={mapRegion} />
              </MapView>
            </View>
          )}

          <Button
            mode="contained"
            onPress={() => setIsModalVisible(true)}
            style={{
              marginBottom: 16,
            }}
          >
            Add Link
          </Button>
          {links.map((link, index) => (
            <Paragraph key={index}>
              {link.name}: {link.url}
            </Paragraph>
          ))}

          <Button mode="contained" onPress={() => submitCollaboration()}>
            Post
          </Button>

          <Modal
            visible={isModalVisible}
            onDismiss={() => setIsModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <TextInput
              label="Link Name"
              value={newLinkName}
              onChangeText={setNewLinkName}
              style={styles.input}
            />
            <TextInput
              label="Link URL"
              value={newLinkUrl}
              onChangeText={setNewLinkUrl}
              style={styles.input}
            />
            <Button mode="contained" onPress={addLink}>
              Add Link
            </Button>
          </Modal>
        </ScrollView>
      </AppLayout>
    );
  }

  if (screen === 3) {
    return (
      <AppLayout>
        <View style={styles.container3}>
          <IconButton
            icon="check-circle"
            size={100}
            iconColor="green"
            style={styles.checkIcon}
          />
          <Text style={styles.title}>Collaboration Posted</Text>
          <Text style={styles.description}>
            Your collaboration has been successfully posted.
          </Text>
        </View>
      </AppLayout>
    );
  }
};

export default CreateCollaborationScreen;
