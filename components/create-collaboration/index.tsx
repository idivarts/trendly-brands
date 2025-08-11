import * as Location from 'expo-location';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";

import ScreenFour from "@/components/create-collaboration/screen-four";
import ScreenOne from "@/components/create-collaboration/screen-one";
import ScreenTwo from "@/components/create-collaboration/screen-two";
import Colors from "@/constants/Colors";
import { useCollaborationContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useProcess } from "@/hooks";
import { Attachment } from '@/shared-libs/firestore/trendly-pro/constants/attachment';
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { ModelStatus } from '@/shared-libs/firestore/trendly-pro/models/status';
import { Console } from '@/shared-libs/utils/console';
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { useConfirmationModel } from '@/shared-uis/components/ConfirmationModal';
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useTheme } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";
import { View } from "../theme/Themed";
import ScreenThree from "./screen-three";

const CreateCollaboration = () => {
  const [collaboration, setCollaboration] = useState<Partial<ICollaboration>>({
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
    preferredContentLanguage: ["English", "Hindi"],
    contentFormat: [],
    platform: [],
    numberOfInfluencersNeeded: 1,
    location: {
      type: "Remote",
      name: "",
      latlong: {
        lat: 0,
        long: 0,
      },
    },
    externalLinks: [],
    questionsToInfluencers: [],
    preferences: {
      timeCommitment: "Full Time",
      influencerNiche: [],
      influencerRelation: "Long Term",
      preferredVideoType: "Integrated Video",
    },
    status: "",
    timeStamp: 0,
    viewsLastHour: 0,
    lastReviewedTimeStamp: 0,
  });

  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [screen, setScreen] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const theme = useTheme();
  const params = useLocalSearchParams();
  const type = params.id ? "Edit" : "Add";

  const {
    isProcessing,
    processMessage,
    processPercentage,
    setIsProcessing,
    setProcessMessage,
    setProcessPercentage,
  } = useProcess();
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const {
    selectedBrand,
  } = useBrandContext();
  const {
    getCollaborationById,
    createCollaboration,
    updateCollaboration,
  } = useCollaborationContext();

  const { openModal } = useConfirmationModel()

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

    setAttachments(collaboration?.attachments || []);

    if (collaboration.location.latlong) {
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
      setIsLoading(true);
      fetchCollaboration(params.id)
        .finally(() => {
          setIsLoading(false);
        })
    }
  }, []);

  const onLocationChange = (
    latlong: { lat: number; long: number },
    address: string,
  ) => {
    setCollaboration({
      ...collaboration,
      location: {
        ...collaboration.location,
        type: "On-Site",
        name: address,
        latlong,
      },
    });
  }

  const handleCollaboration = async (
    data: Partial<ICollaboration>,
  ): Promise<void> => {
    if (params.id && typeof params.id === "string") {
      await updateCollaboration(params.id, data);
    } else {
      await createCollaboration(data)
    }
  }

  const notifyUprade = () => {
    openModal({
      title: "Free Trial!",
      description: "You need to upgrade your plan to be able to post a collaboration",
      confirmAction: () => {
        router.push("/billing")
      },
      confirmText: "Upgrade Now"
    })
  }
  const saveCollaboration = async (
    myStatus: "draft" | "active",
  ) => {
    try {
      if (!AuthApp.currentUser || !selectedBrand) {
        Console.error("User or brand not selected");
        return;
      }

      let status = myStatus
      const isOnFreeTrial = !selectedBrand.isBillingDisabled && selectedBrand.billing?.status != ModelStatus.Accepted
      if (isOnFreeTrial && status == "active") {
        notifyUprade()
        status = "draft"
      }

      let locationAddress = collaboration?.location;

      if (collaboration?.location?.type === "On-Site" && mapRegion.latitude && mapRegion.longitude) {
        locationAddress = {
          ...collaboration.location,
          type: collaboration.location.type || "Remote",
          latlong: {
            lat: mapRegion.latitude,
            long: mapRegion.longitude,
          },
        };
      }

      setIsProcessing(true);
      setProcessMessage('Saving collaboration attachments...');
      setProcessPercentage(40);

      // Upload assets to S3
      // const uploadedAssets = await uploadNewAssets(
      //   attachments,
      //   nativeAssets,
      //   webAssets,
      // );

      setProcessMessage('Saved collaboration attachments...');
      setProcessPercentage(70);

      setProcessMessage('Saving collaboration...');
      setProcessPercentage(100);

      await handleCollaboration({
        ...collaboration,
        attachments: attachments,
        brandId: selectedBrand ? selectedBrand?.id : "",
        budget: {
          min: collaboration.budget?.min || 0,
          max: collaboration.budget?.max || 0,
        },
        managerId: AuthApp.currentUser?.uid as string,
        location: locationAddress,
        status,
        timeStamp: type === "Add" ? Date.now() : collaboration.timeStamp,
      }).then(() => {
        setScreen(4);
        setTimeout(() => {
          router.dismiss(1);
          router.push({
            pathname: "/collaborations",
          });
        }, 3000);
      }).catch((error) => {
        Console.error(error);
        Toaster.error("Failed to save collaboration");
      }).finally(() => {
        setProcessPercentage(0);
        setProcessMessage('');
        setIsProcessing(false);
        if (myStatus == "draft") {
          notifyUprade()
        }
      });
    } catch (error) {
      Console.error(error);
    }
  };

  const submitCollaboration = async () => {
    await saveCollaboration("active");
  };

  const saveAsDraft = async () => {
    await saveCollaboration("draft");
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={Colors(theme).primary}
        />
      </View>
    );
  }

  if (screen === 1) {
    return (
      <ScreenOne
        attachments={attachments}
        collaboration={collaboration}
        setAttachments={setAttachments}
        // handleAssetsUpdateNative={handleAssetsUpdateNative}
        // handleAssetsUpdateWeb={handleAssetsUpdateWeb}
        isEdited={isEdited}
        isSubmitting={isProcessing}
        setCollaboration={setCollaboration}
        setIsEdited={setIsEdited}
        setScreen={setScreen}
        type={type}
      />
    );
  }

  if (screen == 2) {
    return (
      <ScreenTwo
        collaboration={collaboration}
        isEdited={isEdited}
        isSubmitting={isProcessing}
        mapRegion={{
          state: mapRegion,
          setState: setMapRegion,
        }}
        onLocationChange={onLocationChange}
        saveAsDraft={saveAsDraft}
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
        isEdited={isEdited}
        isSubmitting={isProcessing}
        processMessage={processMessage}
        processPercentage={processPercentage}
        saveAsDraft={saveAsDraft}
        setCollaboration={setCollaboration}
        setScreen={setScreen}
        submitCollaboration={submitCollaboration}
        type={type}
      />
    );
  }

  if (screen === 4) {
    return (
      <ScreenFour
        type={type}
      />
    );
  }
};

export default CreateCollaboration;
