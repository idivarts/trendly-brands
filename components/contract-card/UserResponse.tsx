import { IApplications } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { FC } from "react";
import { Text, View } from "../theme/Themed";
import { Button } from "react-native-paper";
import { Pressable, ScrollView } from "react-native";
import RenderMediaItem from "@/shared-uis/components/carousel/render-media-item";
import { processRawAttachment } from "@/utils/attachments";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { formatDistanceToNow } from "date-fns";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";

interface UserResponseProps {
  application?: IApplications;
  influencerQuestions?: string[];
  setConfirmationModalVisible: (value: boolean) => void;
}

const UserResponse: FC<UserResponseProps> = ({
  application,
  influencerQuestions,
  setConfirmationModalVisible,
}) => {
  const attachmentFiltered = application?.attachments.map((attachment) => {
    return processRawAttachment(attachment);
  });
  const theme = useTheme();

  return (
    <View
      style={{
        borderRadius: 5,
        width: "100%",
        gap: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          Application
        </Text>
      </View>
      <View
        style={{
          width: "100%",
          gap: 10,
        }}
      >
        <ScrollView horizontal style={{}}>
          {attachmentFiltered?.map((attachment, index) => (
            <RenderMediaItem
              key={index}
              item={attachment}
              index={index}
              height={100}
              width={100}
              handleImagePress={() => {}}
            />
          ))}
        </ScrollView>
        <Text style={{ fontSize: 16, marginTop: 10 }}>
          {application?.message}
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 16 }}>
            Quote: {application?.quotation || "N/A"}
          </Text>
          {application?.timeline && (
            <Text style={{ fontSize: 16 }}>
              Timeline:{" "}
              {new Date(application?.timeline).toLocaleDateString() || "N/A"}
            </Text>
          )}
        </View>
        {application?.fileAttachments &&
          application.fileAttachments.map((attachment, index) => {
            return (
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                <FontAwesomeIcon icon={faPaperclip} />
                <Text
                  key={index}
                  style={{
                    fontSize: 16,
                  }}
                >
                  {attachment.name}
                </Text>
              </View>
            );
          })}

        <View
          style={{
            flexDirection: "column",
            gap: 10,
          }}
        >
          {application?.answersFromInfluencer &&
            influencerQuestions &&
            application?.answersFromInfluencer.map((answer, index) => {
              return (
                <View
                  style={{
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {influencerQuestions[answer.question]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                    }}
                  >
                    {answer.answer}
                  </Text>
                </View>
              );
            })}
        </View>
      </View>
    </View>
  );
};

export default UserResponse;
