import { CardFooter } from "@/components/ui/card/secondary/card-footer";
import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import InfluencerCard from "@/shared-uis/components/InfluencerCard";
import { InfluencerApplication } from "@/types/Collaboration";
import { convertToKUnits } from "@/utils/conversion";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import Button from "../../ui/button";

interface ApplicationCardProps {
  acceptApplication: () => void;
  bottomSheetAction?: () => void;
  data: InfluencerApplication;
  profileModalAction?: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  acceptApplication,
  bottomSheetAction,
  data,
  profileModalAction,
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
        type="application"
        // customAttachments={data.application.attachments}
        cardActionNode={<Button
          mode="outlined"
          size="small"
          disabled={data.application.status === "pending" ? false : true}
          onPress={() => {
            if (data.application.status === "pending") {
              acceptApplication();
            }
          }}
        >
          <FontAwesomeIcon
            color={Colors(theme).primary}
            icon={faCheck}
            size={12}
            style={{
              marginRight: 6,
              marginTop: -2,
            }}
          />
          {data.application.status === "pending" ? "Accept Application" : "Application Already Accepted"}
        </Button>}
        footerNode={<CardFooter
          quote={convertToKUnits(Number(data.application.quotation)) as string}
        // timeline={new Date(data.application.timeline).toLocaleDateString(
        //   "en-US"
        // )}
        />}
      />
    </>

  );
};
