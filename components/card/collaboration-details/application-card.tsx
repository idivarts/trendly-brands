import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import InfluencerCard from "@/shared-uis/components/InfluencerCard";
import { Text, View } from "@/shared-uis/components/theme/Themed";
import { InfluencerApplication } from "@/types/Collaboration";
import { convertToKUnits } from "@/utils/conversion";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Chip, Button as PaperButton, Surface } from "react-native-paper";

interface ApplicationCardProps {
  acceptApplication: () => void;
  bottomSheetAction?: () => void;
  data: InfluencerApplication;
  profileModalAction?: () => void;
  topHeaderNode?: any
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  acceptApplication,
  bottomSheetAction,
  data,
  profileModalAction,
  topHeaderNode = null,
}) => {
  const theme = useTheme();
  const [influencer, setInfluencer] = useState(data.influencer)
  const { xl } = useBreakpoints()
  return (
    <>
      <InfluencerCard
        xl={xl}
        influencer={{
          ...influencer, profile: {
            ...influencer.profile,
            attachments: [...data.application.attachments, {
              type: "image",
              imageUrl: "https://d1tfun8qrz04mk.cloudfront.net/uploads/file_1751392603_images-1751392601990-Profile%20Images%20v2.png"
            }, ...(influencer.profile?.attachments || [])],
            content: {
              ...influencer.profile?.content,
              about: data.application.message,
            }
          }
        }}
        openProfile={profileModalAction}
        ToggleModal={bottomSheetAction}
        fullHeight={true}
        type="application"
        // customAttachments={data.application.attachments}
        cardActionNode={
          <Surface style={{ borderRadius: 12, elevation: 2, overflow: "hidden" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                gap: 12,
              }}
            >
              {/* Left: Quotation */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Quotation</Text>
                <Text style={{ fontSize: 18, fontWeight: "700" }}>
                  {convertToKUnits(Number(data.application.quotation)) as string}
                </Text>
              </View>

              {/* Divider */}
              <View
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  backgroundColor: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                }}
              />

              {/* Right: Action */}
              <View style={{ flexShrink: 0, flexGrow: 0, alignItems: "flex-end" }}>
                {data.application.status === "pending" ? (
                  <PaperButton
                    mode="contained"
                    compact
                    onPress={() => {
                      if (data.application.status === "pending") {
                        acceptApplication();
                      }
                    }}
                    icon={() => (
                      <FontAwesomeIcon
                        color="#fff"
                        icon={faCheck}
                        size={12}
                        style={{ marginRight: 6, marginTop: -2 }}
                      />
                    )}
                  >
                    Accept Application
                  </PaperButton>
                ) : (
                  <Chip
                    icon={() => (
                      <FontAwesomeIcon
                        color={Colors(theme).primary}
                        icon={faCheck}
                        size={12}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    mode="flat"
                    style={{ backgroundColor: theme.dark ? "rgba(255,255,255,0.08)" : "#F1F5F9" }}
                    textStyle={{ color: Colors(theme).primary, fontWeight: "600" }}
                  >
                    Accepted
                  </Chip>
                )}
              </View>
            </View>
          </Surface>
        }
        topHeaderNode={topHeaderNode}
      />
    </>

  );
};
