import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import InfluencerCard from "@/shared-uis/components/InfluencerCard";
import { InfluencerApplication } from "@/types/Collaboration";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { ApplicationActionBar } from "../../../shared-uis/components/application-action-card";

interface ApplicationCardProps {
  acceptApplication: () => void;
  rejectApplication: () => void;
  bottomSheetAction?: () => void;
  data: InfluencerApplication;
  profileModalAction?: () => void;
  topHeaderNode?: any
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  acceptApplication,
  rejectApplication,
  bottomSheetAction,
  data,
  profileModalAction,
  topHeaderNode = null,
}) => {
  const theme = useTheme();
  const [influencer, setInfluencer] = useState(data.influencer)
  const { xl } = useBreakpoints()
  const { isOnFreeTrial, isProfileLocked } = useBrandContext();
  return (
    <>
      <InfluencerCard
        xl={xl}
        isOnFreePlan={isOnFreeTrial}
        lockProfile={false}
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
          <ApplicationActionBar
            application={data.application}
            onAccept={() => {
              if (data.application.status === "pending" || data.application.status === "shortlisted") {
                acceptApplication();
              }
            }}
            onReject={() => rejectApplication()}
          />
        }
        topHeaderNode={topHeaderNode}
      />
    </>

  );
};
