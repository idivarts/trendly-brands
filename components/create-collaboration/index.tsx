import React, { useEffect, useState } from "react";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from 'expo-location';
import { SelectItem } from "@/components/ui/select";
import ScreenOne from "@/components/create-collaboration/screen-one";
import ScreenTwo from "@/components/create-collaboration/screen-two";
import ScreenThree from "@/components/create-collaboration/screen-three";
import { useCollaborationContext } from "@/contexts";
import { SocialPlatform } from "@/shared-libs/firestore/trendly-pro/constants/social-platform";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { CollaborationType } from "@/shared-libs/firestore/trendly-pro/constants/collaboration-type";

const CreateCollaboration = () => {
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
  const params = useLocalSearchParams();
  const [location, setLocation] = useState("Remote");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [links, setLinks] = useState<any[]>([]);
  const [screen, setScreen] = useState(1);
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

  const type = params.id ? "Edit" : "Add";

  const {
    getCollaborationById,
    createCollaboration,
    updateCollaboration,
  } = useCollaborationContext();

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

  const fetchCollaboration = async (
    id: string,
  ) => {
    const collaboration = await getCollaborationById(id);
    setCollaborationName(collaboration.name);
    setAboutCollab(collaboration.description || "");
    setBudgetMin(collaboration.budget.min?.toString() || "");
    setBudgetMax(collaboration.budget.max?.toString() || "");
    setNumInfluencers(collaboration.numberOfInfluencersNeeded);
    setPromotionType([
      {
        label: collaboration.promotionType,
        value: collaboration.promotionType,
      },
    ]);
    setCollabType([
      {
        label: collaboration.collaborationType,
        value: collaboration.collaborationType,
      },
    ]);
    setPlatform([
      {
        label: collaboration.platform,
        value: collaboration.platform,
      },
    ]);
    setLocation(collaboration.location.type);
    setLinks(collaboration.externalLinks || []);
    if (collaboration.location.name && collaboration.location.latlong) {
      setFormattedAddress(collaboration.location.name);
      setMapRegion({
        latitude: collaboration.location.latlong.lat,
        longitude: collaboration.location.latlong.long,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }

  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      fetchCollaboration(params.id);
    }
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

  const handleCollaboration = async (
    data: any,
  ): Promise<void> => {
    if (params.id && typeof params.id === "string") {
      await updateCollaboration(params.id, data);
    } else {
      await createCollaboration(data)
    }
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

      await handleCollaboration({
        name: collaborationName,
        brandId: selectedBrand ? selectedBrand.id : "",
        managerId: AuthApp.currentUser?.uid as string,
        description: aboutCollab,
        timeStamp: Date.now(),
        budget: {
          min: Number(budgetMin),
          max: Number(budgetMax),
        },
        promotionType: promotionType[0].value as PromotionType,
        collaborationType: collabType[0].value as CollaborationType,
        numberOfInfluencersNeeded: numInfluencers,
        platform: platform[0].value as SocialPlatform,
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
      <ScreenOne
        type={type}
        data={{
          collaborationName,
          aboutCollab,
          budgetMin,
          budgetMax,
          numInfluencers,
          promotionType,
          collabType,
          platform,
        }}
        setScreen={setScreen}
        setState={{
          collaborationName: setCollaborationName,
          aboutCollab: setAboutCollab,
          budgetMin: setBudgetMin,
          budgetMax: setBudgetMax,
          numInfluencers: setNumInfluencers,
          promotionType: setPromotionType,
          collabType: setCollabType,
          platform: setPlatform,
        }}
      />
    );
  }

  if (screen == 2) {
    return (
      <ScreenTwo
        type={type}
        setScreen={setScreen}
        data={{
          location,
          links,
          mapRegion,
          newLinkName,
          newLinkUrl,
        }}
        setState={{
          location: setLocation,
          links: setLinks,
          mapRegion: setMapRegion,
          newLinkName: setNewLinkName,
          newLinkUrl: setNewLinkUrl,
        }}
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        onFormattedAddressChange={onFormattedAddressChange}
        submitCollaboration={submitCollaboration}
        addLink={addLink}
      />
    );
  }

  if (screen === 3) {
    return (
      <ScreenThree
        type={type}
      />
    );
  }
};

export default CreateCollaboration;
