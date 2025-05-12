import Colors from "@/constants/Colors";
import { MAX_WIDTH_WEB } from "@/constants/Container";
import useInvitation from "@/hooks/use-invitation";
import Carousel from "@/shared-uis/components/carousel/carousel";
import { InfluencerMetrics } from "@/shared-uis/components/influencers/influencer-metrics";
import { View } from "@/shared-uis/components/theme/Themed";
import { User } from "@/types/User";
import { processRawAttachment } from "@/utils/attachments";
import { truncateText } from "@/utils/text";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Dimensions, Platform, Pressable } from "react-native";
import Button from "../../ui/button";
import { Card } from "../../ui/card/secondary";
import { CardDescription } from "../../ui/card/secondary/card-description";
import { CardHeader } from "../../ui/card/secondary/card-header";

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
        <View style={{ paddingHorizontal: 16 }}>
          <InfluencerMetrics user={data} action={<Button
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
          </Button>} />
        </View>
        <CardDescription
          text={truncateText(data.profile?.content?.about || "", 160)}
        />
      </Pressable>
    </Card>
  );
};

export default InvitationCard;
