import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Dimensions } from "react-native";
import { Text, Card, Paragraph, Button, Portal } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/CollaborationDetails.styles";
import Colors from "@/constants/Colors";
import Carousel from "@/shared-uis/components/carousel/carousel";
import { processRawAttachment } from "@/utils/attachments";
import { formatDistanceToNow } from "date-fns";
import {
  IApplications,
  ICollaboration,
} from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import UserResponse from "@/components/contract-card/UserResponse";
import RenderHTML from "react-native-render-html";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import ActionContainer from "./ActionContainer";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import MemberContainer from "./MemberContainer";
import AddMembersModal from "./AddMemberModal";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import FeedbackModal from "./FeedbackModal";
import { router } from "expo-router";

interface CollaborationDetailsContentProps {
  collaborationDetail: ICollaboration;
  applicationData?: IApplications;
  userData: IUsers;
  contractData: IContracts;
  refreshData: () => void;
}

const ContractDetailsContent = (props: CollaborationDetailsContentProps) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [membersInContract, setMembersInContract] = useState<any[]>([]);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [updateMemberContainer, setUpdateMemberContainer] = useState(0);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Collaboration Details */}
      <View style={styles.profileCard}>
        {props?.applicationData?.attachments &&
          props?.applicationData?.attachments.length > 0 && (
            <Carousel
              theme={theme}
              data={
                props?.applicationData?.attachments?.map((attachment) =>
                  processRawAttachment(attachment)
                ) || []
              }
            />
          )}
        <Card.Content style={styles.profileContent}>
          {/* About Collaboration */}
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
            }}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text variant="headlineMedium" style={styles.name}>
                {props.userData.name}
              </Text>
              {props.collaborationDetail.timeStamp ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors(theme).text,
                    paddingRight: 8,
                  }}
                >
                  {formatDistanceToNow(props.collaborationDetail.timeStamp, {
                    addSuffix: true,
                  })}
                </Text>
              ) : null}
            </View>
            <View
              style={{
                width: "100%",
              }}
            >
              <RenderHTML
                source={{
                  html:
                    props.userData.profile?.content?.about ||
                    "<p>No content available.</p>",
                }}
                contentWidth={Dimensions.get("window").width}
                defaultTextProps={{
                  style: {
                    color: Colors(theme).text,
                    fontSize: 16,
                    lineHeight: 22,
                  },
                }}
              />
            </View>
          </View>

          <ActionContainer
            contract={props.contractData}
            refreshData={props.refreshData}
            feedbackModalVisible={() => setFeedbackModalVisible(true)}
            userData={props.userData}
          />

          <MemberContainer
            //@ts-ignore
            channelId={props.contractData.streamChannelId}
            setMembersFromBrand={setMembersInContract}
            setShowModal={() => setAddMemberModal(true)}
            key={updateMemberContainer}
            updateMemberContainer={updateMemberContainer}
          />

          <UserResponse
            application={props.applicationData}
            influencerQuestions={
              props?.collaborationDetail?.questionsToInfluencers
            }
            setConfirmationModalVisible={() => {}}
          />
          <Pressable
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              width: "100%",
              borderWidth: 0.3,
              borderColor: Colors(theme).gray300,
              padding: 10,
              borderRadius: 5,
            }}
            onPress={() => {
              router.push(
                `/collaboration-details/${props.contractData.collaborationId}`
              );
            }}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: Colors(theme).text,
                }}
              >
                {props.collaborationDetail.name}
              </Text>
              <FontAwesomeIcon icon={faArrowRight} size={20} />
            </View>
            <Text
              style={{
                fontSize: 16,
                color: Colors(theme).gray100,
              }}
            >
              {props.collaborationDetail.description}
            </Text>
          </Pressable>
        </Card.Content>
      </View>
      <AddMembersModal
        onDismiss={() => setAddMemberModal(false)}
        visible={addMemberModal}
        membersAlreadyInContract={membersInContract}
        channelId={props.contractData.streamChannelId}
        refreshData={props.refreshData}
        updateMemberContainer={() =>
          setUpdateMemberContainer((prev) => prev + 1)
        }
      />
      {props.contractData.status === 2 && (
        <Portal>
          <FeedbackModal
            feedbackGiven={
              props.contractData.feedbackFromBrand?.feedbackReview
                ? true
                : false
            }
            setVisibility={() => setFeedbackModalVisible(false)}
            star={props.contractData.feedbackFromBrand?.ratings || 0}
            visible={feedbackModalVisible}
            contract={props.contractData}
            refreshData={props.refreshData}
          />
        </Portal>
      )}
    </ScrollView>
  );
};

export default ContractDetailsContent;
