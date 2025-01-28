import React from "react";
import { Dimensions, Platform, Pressable } from "react-native";
import Button from "../../ui/button";
import Carousel from "@/shared-uis/components/carousel/carousel";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Colors from "@/constants/Colors";
import { Card } from "@/components/ui/card/secondary";
import { CardHeader } from "@/components/ui/card/secondary/card-header";
import { CardActions } from "@/components/ui/card/secondary/card-actions";
import { CardDescription } from "@/components/ui/card/secondary/card-description";
import { CardFooter } from "@/components/ui/card/secondary/card-footer";
import { processRawAttachment } from "@/utils/attachments";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { InfluencerApplication } from "@/types/Collaboration";
import { convertToKUnits } from "@/utils/conversion";
import { formatTimeToNow } from "@/utils/date";
import { MAX_WIDTH_WEB } from "@/constants/Container";

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

  return (
    <Card>
      <CardHeader
        avatar={data.influencer.profileImage || ""}
        handle={data.influencer.socials?.[0]}
        isVerified={data.influencer.isVerified}
        leftAction={profileModalAction}
        name={data.influencer.name}
        rightAction={bottomSheetAction}
        timestamp={formatTimeToNow(data.application.timeStamp)}
      />
      <Carousel
        containerHeight={
          data.application?.attachments?.length === 1
            ? Platform.OS === "web"
              ? 560
              : 288
            : undefined
        }
        data={data.application.attachments.map((attachment: Attachment) =>
          processRawAttachment(attachment)
        )}
        theme={theme}
        carouselWidth={
          Platform.OS === "web" ? MAX_WIDTH_WEB : Dimensions.get("window").width
        }
      />
      <Pressable onPress={profileModalAction}>
        <CardActions
          metrics={{
            followers: data.influencer.backend?.followers || 0,
            reach: data.influencer.backend?.reach || 0,
            rating: data.influencer.backend?.rating || 0,
          }}
          action={
            <Button
              mode="outlined"
              size="small"
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
              {data.application.status === "pending" ? "Accept" : "Accepted"}
            </Button>
          }
        />
        <CardDescription text={data.application.message} />
        <CardFooter
          quote={convertToKUnits(Number(data.application.quotation)) as string}
          timeline={new Date(data.application.timeline).toLocaleDateString(
            "en-US"
          )}
        />
      </Pressable>
    </Card>
  );
};
