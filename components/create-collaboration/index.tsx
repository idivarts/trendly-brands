import React, { useEffect, useState } from "react";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from 'expo-location';
import ScreenOne from "@/components/create-collaboration/screen-one";
import ScreenTwo from "@/components/create-collaboration/screen-two";
import ScreenFour from "@/components/create-collaboration/screen-four";
import { useCollaborationContext } from "@/contexts";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { NativeAssetItem, WebAssetItem } from "@/shared-uis/types/Asset";
import ScreenThree from "./screen-three";
import { Collaboration } from "@/types/Collaboration";

const CreateCollaboration = () => {
  const [collaboration, setCollaboration] = useState<Partial<Collaboration>>({
    name: "",
    brandId: "",
    managerId: "",
    attachments: [],
    description: "",
    promotionType: PromotionType.BARTER_COLLAB,
    budget: {
      min: 0,
      max: 0,
    },
    preferredContentLanguage: [],
    contentFormat: [],
    platform: [],
    numberOfInfluencersNeeded: 0,
    location: {
      type: "",
      name: "",
      latlong: {
        lat: 0,
        long: 0,
      },
    },
    externalLinks: [],
    questionsToInfluencers: [],
    status: "",
    timeStamp: 0,
    viewsLastHour: 0,
    lastReviewedTimeStamp: 0,
  });

  const [attachments, setAttachments] = useState<any[]>([]);
  const [nativeAssets, setNativeAssets] = useState<NativeAssetItem[]>([]);
  const [webAssets, setWebAssets] = useState<WebAssetItem[]>([]);

  const [location, setLocation] = useState("Remote");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const params = useLocalSearchParams();
  const [screen, setScreen] = useState(1);
  const { selectedBrand } = useBrandContext();
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
    setCollaboration(collaboration);

    setLocation(collaboration.location.type);
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
        !collaboration.name ||
        !collaboration.description ||
        !collaboration.promotionType ||
        (collaboration.promotionType === PromotionType.PAID_COLLAB &&
          (!collaboration.budget?.min || !collaboration.budget?.max)) ||
        !collaboration.platform ||
        !collaboration.contentFormat ||
        !location
      ) {
        Toaster.error("Please fill all fields");
        return;
      }

      let locationAddress = {};
      if (location === "On-Site" && mapRegion.latitude && mapRegion.longitude) {
        locationAddress = {
          name: formattedAddress,
          latlong: {
            lat: mapRegion.latitude,
            long: mapRegion.longitude,
          },
        };
      }

      await handleCollaboration({
        ...collaboration,
        brandId: selectedBrand ? selectedBrand.id : "",
        managerId: AuthApp.currentUser?.uid as string,
        location: {
          type: location,
          ...locationAddress,
        },
        status: "active",
        timeStamp: Date.now(),
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

  const handleAssetsUpdateNative = (items: NativeAssetItem[]) => {
    setNativeAssets(items);
  }

  const handleAssetsUpdateWeb = (items: WebAssetItem[]) => {
    setWebAssets(items);
  }

  if (screen === 1) {
    return (
      <ScreenOne
        attachments={attachments}
        collaboration={collaboration}
        handleAssetsUpdateNative={handleAssetsUpdateNative}
        handleAssetsUpdateWeb={handleAssetsUpdateWeb}
        setCollaboration={setCollaboration}
        setScreen={setScreen}
        type={type}
      />
    );
  }

  if (screen == 2) {
    return (
      <ScreenTwo
        collaboration={collaboration}
        mapRegion={{
          state: mapRegion,
          setState: setMapRegion,
        }}
        onFormattedAddressChange={onFormattedAddressChange}
        setCollaboration={setCollaboration}
        setScreen={setScreen}
        type={type}
      />
    );
  }

  if (screen === 3) {
    return (
      <ScreenThree
        collaboration={collaboration}
        setCollaboration={setCollaboration}
        setScreen={setScreen}
        submitCollaboration={submitCollaboration}
        type={type}
      />
    );
  }

  if (screen === 3) {
    return (
      <ScreenFour
        type={type}
      />
    );
  }
};

export default CreateCollaboration;
