import { IApplications } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Console } from "@/shared-libs/utils/console";
import RenderMediaItem from "@/shared-uis/components/carousel/render-media-item";
import { processRawAttachment } from "@/utils/attachments";
import { useTheme } from "@react-navigation/native";
import { FC } from "react";
import { Linking, ScrollView } from "react-native";
import { Text, View } from "../theme/Themed";

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

  const downloadAndSaveFile = async (url: string, filename: string) => {
    try {
      Linking.openURL(url)
      // const { uri } = await FileSystem.downloadAsync(
      //   url,
      //   FileSystem.documentDirectory + filename
      // );
      // if (Platform.OS === "web") {
      //   Sharing.shareAsync(uri);
      // } else {
      //   await Sharing.shareAsync(uri);
      // }
    } catch (error) {
      Console.error(error, "Error downloading file");
      setConfirmationModalVisible(false);
      alert("Failed to download file. Please try again.");
    }
  };

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
          gap: 16,
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
              handleImagePress={() => { }}
            />
          ))}
        </ScrollView>
        <Text style={{ fontSize: 16 }}>{application?.message}</Text>
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 16 }}>
            Quote: {application?.quotation || "N/A"}
          </Text>
          {/* {application?.timeline && (
            <Text style={{ fontSize: 16 }}>
              Timeline:{" "}
              {new Date(application?.timeline).toLocaleDateString() || "N/A"}
            </Text>
          )} */}
        </View>
        {/* {application?.fileAttachments &&
          application.fileAttachments.map((attachment, index) => {
            return (
              <Pressable
                key={index}
                onPress={() =>
                  downloadAndSaveFile(attachment.url, attachment.name)
                }
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <FontAwesomeIcon icon={faPaperclip} />
                <Text
                  key={index}
                  style={{
                    fontSize: 16,
                    textDecorationLine: "underline",
                  }}
                >
                  {attachment.name}
                </Text>
              </Pressable>
            );
          })} */}

        <View
          style={{
            flexDirection: "column",
            gap: 16,
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
                    Q{") "}
                    {influencerQuestions[answer.question]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                    }}
                  >
                    A{") "}
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
