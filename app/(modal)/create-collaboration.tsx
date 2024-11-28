import AppLayout from "@/layouts/app-layout";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  IconButton,
  RadioButton,
  Modal,
} from "react-native-paper";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { useTheme } from "@react-navigation/native";
import { addDoc, collection } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useBrandContext } from "@/contexts/brand-context.provider";
import Colors from "@/constants/Colors";
import { router } from "expo-router";
import * as Location from 'expo-location';
import Select, { SelectItem } from "@/components/ui/select";
import { Text, View } from "@/components/theme/Themed";
import CreateCollaborationMap from "@/components/collaboration/create-collaboration/CreateCollaborationMap";
import { COLLAB_TYPES, PLATFORM_TYPES, PROMOTION_TYPES } from "@/constants/CreateCollaborationForm";

const CreateCollaborationScreen = () => {
  const [collaborationName, setCollaborationName] = useState("");
  const [aboutCollab, setAboutCollab] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [numInfluencers, setNumInfluencers] = useState(1);
  const [promotionType, setPromotionType] = useState<SelectItem[]>([]);
  const [collabType, setCollabType] = useState<SelectItem[]>([]);
  const [platform, setPlatform] = useState([
    {
      label: "Instagram",
      value: "Instagram",
    },
  ]);
  const [location, setLocation] = useState("Remote");
  const [formattedAddress, setFormattedAddress] = useState("");
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

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setMapRegion({
        ...mapRegion,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }

    getCurrentLocation();
  }, []);

  const addLink = () => {
    if (!newLinkName || !newLinkUrl) {
      Toaster.error("Please fill all fields");
      return;
    }

    setLinks([...links, { name: newLinkName, url: newLinkUrl }]);
    setNewLinkName("");
    setNewLinkUrl("");
    setIsModalVisible(false);
  };

  const onFormattedAddressChange = (address: string) => {
    setFormattedAddress(address);
  }

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

      let locationAddress = {};
      if (location === "Physical" && mapRegion.latitude && mapRegion.longitude) {
        locationAddress = {
          name: formattedAddress,
          latlong: {
            lat: mapRegion.latitude,
            long: mapRegion.longitude,
          },
        };
      }

      await addDoc(collabRef, {
        name: collaborationName,
        brandId: selectedBrand ? selectedBrand.id : "",
        managerId: AuthApp.currentUser?.uid,
        description: aboutCollab,
        timeStamp: Date.now(),
        budget: {
          min: budgetMin,
          max: budgetMax,
        },
        promotionType: promotionType[0].value,
        collaborationType: collabType[0].value,
        numberOfInfluencersNeeded: numInfluencers,
        platform: platform[0].value,
        location: {
          type: location,
          ...locationAddress,
        },
        externalLinks: links,
        status: "active",
      }).then(() => {
        setScreen(3);
        setTimeout(() => {
          router.dismiss(1);
          router.push("/collaborations");
        }, 3000);
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (screen === 1) {
    return (
      <AppLayout>
        <ScrollView
          contentContainerStyle={{
            paddingVertical: 16,
            gap: 16,
          }}
          style={styles.container}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {
              Platform.OS === "web" && (
                <IconButton
                  icon="arrow-left"
                  iconColor={Colors(theme).text}
                  onPress={() => router.push("/collaborations")}
                />
              )
            }
            <Title style={styles.title}>Create a Collaboration</Title>
          </View>
          <TextInput
            label="Collaboration Name"
            mode="outlined"
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
            value={collaborationName}
          />
          <TextInput
            label="About this Collaboration"
            mode="outlined"
            // multiline
            onChangeText={(text) => setAboutCollab(text)}
            style={styles.input}
            textColor={Colors(theme).text}
            value={aboutCollab}
          />
          <View style={styles.budgetContainer}>
            <TextInput
              label="Budget Min"
              mode="outlined"
              onChangeText={(text) => setBudgetMin(text)}
              style={styles.budgetInput}
              textColor={Colors(theme).text}
              value={budgetMin}
            />
            <TextInput
              label="Budget Max"
              mode="outlined"
              onChangeText={(text) => setBudgetMax(text)}
              style={styles.budgetInput}
              textColor={Colors(theme).text}
              value={budgetMax}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Paragraph style={styles.paragraph}>
              Number of Influencers Involved:
            </Paragraph>
            <View style={styles.counter}>
              <IconButton
                icon="minus"
                iconColor={Colors(theme).white}
                onPress={() => setNumInfluencers(Math.max(1, numInfluencers - 1))}
                style={styles.iconButton}
              />
              <View
                style={styles.iconButtonContent}
              >
                <Text
                  style={{
                    color: Colors(theme).primary,
                  }}
                >
                  {numInfluencers}
                </Text>
              </View>
              <IconButton
                icon="plus"
                iconColor={Colors(theme).white}
                onPress={() => setNumInfluencers(numInfluencers + 1)}
                style={styles.iconButton}
              />
            </View>
          </View>
          <View
            style={styles.selectContainer}
          >
            <Paragraph style={styles.paragraph}>Promotion Type:</Paragraph>
            <Select
              items={PROMOTION_TYPES}
              onSelect={(selectedItems) => setPromotionType(selectedItems)}
              value={promotionType}
            />
          </View>
          <View
            style={styles.selectContainer}
          >
            <Paragraph style={styles.paragraph}>Collaboration Type:</Paragraph>
            <Select
              items={COLLAB_TYPES}
              onSelect={(selectedItems) => setCollabType(selectedItems)}
              value={collabType}
            />
          </View>
          <View
            style={styles.selectContainer}
          >
            <Paragraph style={styles.paragraph}>Platform:</Paragraph>
            <Select
              items={PLATFORM_TYPES}
              onSelect={(selectedItems) => setPlatform(selectedItems)}
              value={platform}
            />
          </View>
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
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <IconButton
              icon="arrow-left"
              onPress={() => setScreen(1)}
              iconColor={Colors(theme).text}
            />
            <Title style={styles.title}>Create a Collaboration</Title>
          </View>

          <View>
            <Paragraph
              style={[
                styles.paragraph,
                {
                  paddingLeft: 16,
                }
              ]}
            >
              Location:
            </Paragraph>
            <RadioButton.Group
              onValueChange={(newValue) => setLocation(newValue)}
              value={location}
            >
              <RadioButton.Item
                mode="android"
                label="Remote"
                value="Remote"
                labelStyle={{
                  color: Colors(theme).text,
                }}
              />
              <RadioButton.Item
                mode="android"
                label="Physical"
                value="Physical"
                labelStyle={{
                  color: Colors(theme).text,
                }}
              />
            </RadioButton.Group>
          </View>

          {
            location === "Physical" && (
              <CreateCollaborationMap
                mapRegion={mapRegion}
                onMapRegionChange={(region) => setMapRegion(region)}
                onFormattedAddressChange={onFormattedAddressChange}
              />
            )
          }

          <Button
            mode="contained"
            onPress={() => setIsModalVisible(true)}
            style={{
              marginBottom: 16,
            }}
          >
            Add Link
          </Button>
          {
            links.map((link, index) => (
              <Paragraph key={index + link.url}>
                {link.name}: {link.url}
              </Paragraph>
            ))
          }

          <Button mode="contained" onPress={() => submitCollaboration()}>
            Post
          </Button>
        </ScrollView>

        <Modal
          contentContainerStyle={styles.modalContainer}
          onDismiss={() => setIsModalVisible(false)}
          visible={isModalVisible}
        >
          <TextInput
            label="Link Name"
            mode="outlined"
            onChangeText={setNewLinkName}
            style={styles.input}
            value={newLinkName}
          />
          <TextInput
            label="Link URL"
            mode="outlined"
            onChangeText={setNewLinkUrl}
            style={styles.input}
            value={newLinkUrl}
          />
          <Button
            mode="contained"
            onPress={addLink}
          >
            Add Link
          </Button>
        </Modal>
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
