import Colors from "@/constants/Colors";
import { useChatContext } from "@/contexts";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import {
  faCircleInfo,
  faStar,
  faStarHalfStroke,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { FC, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";

interface ActionContainerProps {
  contract: IContracts;
  refreshData: () => void;
  feedbackModalVisible: () => void;
  userData: IUsers;
}

const ActionContainer: FC<ActionContainerProps> = ({
  contract,
  refreshData,
  feedbackModalVisible,
  userData,
}) => {
  const theme = useTheme();
  const [manager, setManager] = useState<IManagers>();
  const { fetchChannelCid } = useChatContext();

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <>
        {Array.from({ length: fullStars }, (_, i) => (
          <FontAwesomeIcon
            key={i}
            icon={faStar}
            size={16}
            color={Colors(theme).yellow}
          />
        ))}
        {hasHalfStar && (
          <FontAwesomeIcon
            icon={faStarHalfStroke}
            size={16}
            color={Colors(theme).yellow}
          />
        )}
      </>
    );
  };

  const startContract = async () => {
    const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
    const timeStarted = new Date().getTime();
    await updateDoc(contractRef, {
      status: 1,
      contractTimestamp: {
        startedOn: timeStarted,
      },
    })
    await HttpWrapper.fetch(`/api/collabs/contracts/${contract.streamChannelId}`, {
      method: "POST",
    }).then(r => {
      Toaster.success("Your Contract has started")
    })
    refreshData();
  };

  const fetchManager = async () => {
    if (!contract.feedbackFromBrand?.managerId) return;
    const managerRef = doc(
      FirestoreDB,
      "managers",
      contract.feedbackFromBrand?.managerId
    );
    const manager = await getDoc(managerRef);
    setManager(manager.data() as IManagers);
  };

  useEffect(() => {
    fetchManager();
  }, [contract.feedbackFromBrand?.managerId]);

  const { openModal } = useConfirmationModel()

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {contract.status < 2 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {contract.status === 0 && (
            <>
              <Button
                mode="outlined"
                style={{
                  flex: 1,
                }}
                onPress={() => {
                  HttpWrapper.fetch(`/api/collabs/collaborations/${contract.collaborationId}/applications/${contract.userId}/revise`, {
                    method: "POST",
                  }).then(r => {
                    Toaster.success("Successfully notified influencer to revise quotation")
                  })
                }}
              >
                Ask To Revise Quote
              </Button>
              <Button
                mode="contained"
                style={{
                  flex: 1,
                }}
                onPress={() => {
                  openModal({
                    confirmAction: startContract,
                    confirmText: "Confirm",
                    title: "Start this Contract?",
                    description: "Are you sure? Make sure you discuss the pricing and final deliverable before starting the contract"
                  })
                }}
              >
                Start Contract
              </Button>
            </>
          )}
          {contract.status === 1 && (
            <>
              <Button
                mode="contained-tonal"
                style={{
                  flex: 1,
                }}
                onPress={() => {
                  openModal({
                    confirmAction: feedbackModalVisible,
                    confirmText: "End Contract",
                    title: "End your contract?",
                    description: "Are you sure you want to end the contract? This action cant be reversed."
                  })
                }}
              >
                End Contract
              </Button>
              <Button
                mode="contained"
                style={{
                  flex: 1,
                }}
                onPress={async () => {

                  if (Platform.OS == "web")
                    router.navigate(`/messages?channelId=${contract.streamChannelId}`);
                  else {
                    const channelCid = await fetchChannelCid(
                      contract.streamChannelId
                    );
                    router.navigate(`/channel/${channelCid}`);
                  }
                }}
              >
                Go to Messages
              </Button>
            </>
          )}
          {/* {contract.status === 2 && !contract.feedbackFromBrand && (
            <>
              <Button
                mode="contained"
                style={{
                  flex: 1,
                }}
                onPress={feedbackModalVisible}
              >
                Give Feedback
              </Button>
            </>
          )} */}
        </View>
      )}
      {contract.feedbackFromBrand && (
        <View
          style={{
            width: "100%",
            borderWidth: 0.3,
            padding: 10,
            borderRadius: 10,
            gap: 10,
            borderColor: Colors(theme).gray300,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            {renderStars(contract.feedbackFromBrand.ratings || 0)}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flexGrow: 1,
            }}
          >
            <ImageComponent
              url={manager?.profileImage || ""}
              altText={manager?.name || ""}
              initials={manager?.name || ""}
              shape="circle"
              size="small"
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: Colors(theme).text,
                }}
              >
                From Brand ({manager?.name})
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  flexWrap: "wrap",
                  overflow: "hidden",
                  lineHeight: 22,
                  color: Colors(theme).text,
                }}
              >
                {contract.feedbackFromBrand.feedbackReview}
              </Text>
            </View>
          </View>
        </View>
      )}
      {contract.feedbackFromInfluencer && (
        <View
          style={{
            borderWidth: 0.3,
            padding: 10,
            borderRadius: 10,
            gap: 10,
            borderColor: Colors(theme).gray300,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            {renderStars(contract.feedbackFromInfluencer.ratings || 0)}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flexGrow: 1,
            }}
          >
            <ImageComponent
              url={userData.profileImage || ""}
              altText={userData.name}
              initials={userData.name}
              shape="circle"
              size="small"
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: Colors(theme).text,
                }}
              >
                From Influencer ({userData.name})
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  flexWrap: "wrap",
                  overflow: "hidden",
                  lineHeight: 22,
                  color: Colors(theme).text,
                }}
              >
                {contract.feedbackFromInfluencer?.feedbackReview}
              </Text>
            </View>
          </View>
        </View>
      )}
      <View
        style={{
          backgroundColor:
            contract.status === 0 ||
              contract.status === 1 ||
              contract.status === 2
              ? Colors(theme).gold
              : Colors(theme).green,
          padding: 16,
          borderRadius: 5,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FontAwesomeIcon icon={faCircleInfo} size={20} />
        <Text style={{ fontSize: 16, width: "95%" }}>
          {contract.status === 0
            ? "Please make sure to use this chat to first understand the the influencer. Post that, you can start your collaboration here"
            : contract.status === 1
              ? "Please note, if your collaboration is done, we would need you to close the collaboration here. Having open collaborations idle for a long time can end up reducing the rating"
              : contract.status === 2
                ? "Feedbacks are important for us. Our platform works on what people give feedback to each other. You see that other persons feedback only if you give your feedback"
                : "You can create new collaboration and invite user to collaboration"}
        </Text>
      </View>
    </View>
  );
};

export default ActionContainer;
