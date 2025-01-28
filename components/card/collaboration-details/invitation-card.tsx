import React from "react";
import Button from "../../ui/button";
import { Card } from "../../ui/card/secondary";
import { CardHeader } from "../../ui/card/secondary/card-header";
import { CardDescription } from "../../ui/card/secondary/card-description";
import { CardActions } from "../../ui/card/secondary/card-actions";
import Carousel from "@/shared-uis/components/carousel/carousel";
import { useTheme } from "@react-navigation/native";
import { User } from "@/types/User";
import { processRawAttachment } from "@/utils/attachments";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import Colors from "@/constants/Colors";
import useInvitation from "@/hooks/use-invitation";
import { Dimensions, Platform, Pressable } from "react-native";
import { MAX_WIDTH_WEB } from "@/constants/Container";

interface InvitationCardProps {
  bottomSheetAction?: () => void;
  checkIfAlreadyInvited: (influencerId: string) => Promise<boolean>;
  data: User;
  inviteInfluencer: () => void;
  profileModalAction?: () => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  bottomSheetAction,
  checkIfAlreadyInvited,
  data,
  inviteInfluencer,
  profileModalAction,
}) => {
  const theme = useTheme();
  const { isAlreadyInvited } = useInvitation({
    checkIfAlreadyInvited,
    influencerId: data.id,
  });

  return (
    <Card>
      <CardHeader
        avatar={data?.profileImage || ""}
        handle={data.socials?.[0]}
        isVerified={data.isVerified}
        leftAction={profileModalAction}
        name={data.name}
        rightAction={bottomSheetAction}
      />
      <Carousel
        containerHeight={
          data.profile?.attachments?.length === 1
            ? Platform.OS === "web"
              ? 560
              : 288
            : undefined
        }
        data={
          data.profile?.attachments?.map((attachment) =>
            processRawAttachment(attachment)
          ) || []
        }
        theme={theme}
        carouselWidth={
          Platform.OS === "web" ? MAX_WIDTH_WEB : Dimensions.get("window").width
        }
      />
      <Pressable onPress={profileModalAction}>
        <CardActions
          metrics={{
            followers: data.backend?.followers || 0,
            reach: data.backend?.reach || 0,
            rating: data.backend?.rating || 0,
          }}
          action={
            <Button
              mode="outlined"
              onPress={() => {
                if (!isAlreadyInvited) {
                  inviteInfluencer();
                }
              }}
            >
              <FontAwesomeIcon
                color={Colors(theme).primary}
                icon={isAlreadyInvited ? faCheck : faPlus}
                size={12}
                style={{
                  marginRight: 6,
                  marginTop: -1,
                }}
              />
              {isAlreadyInvited ? "Already Invited" : "Invite"}
            </Button>
          }
        />
        <CardDescription text={data.profile?.content?.about || ""} />
      </Pressable>
    </Card>
  );
};

export default InvitationCard;
