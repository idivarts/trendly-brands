import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import useInvitation from "@/hooks/use-invitation";
import InfluencerCard from "@/shared-uis/components/InfluencerCard";
import { User } from "@/types/User";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import Button from "../../ui/button";

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
  const { xl } = useBreakpoints()

  return (
    <>
      <InfluencerCard
        xl={xl}
        influencer={data}
        type="invitation"
        ToggleModal={bottomSheetAction}
        fullHeight={true}
        cardActionNode={<Button
          mode="outlined"
          disabled={isAlreadyInvited ? true : false}
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
          {isAlreadyInvited ? "Already Invited" : "Invite Influencer"}
        </Button>}
        openProfile={profileModalAction}
      />
    </>
  );
};

export default InvitationCard;
