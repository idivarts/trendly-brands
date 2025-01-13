import React from 'react';
import Button from '../../ui/button';
import { Card } from '../../ui/card/secondary';
import { CardHeader } from '../../ui/card/secondary/card-header';
import { CardDescription } from '../../ui/card/secondary/card-description';
import { CardActions } from '../../ui/card/secondary/card-actions';
import Carousel from '@/shared-uis/components/carousel/carousel';
import { useTheme } from '@react-navigation/native';
import { User } from '@/types/User';
import { processRawAttachment } from '@/utils/attachments';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import Colors from '@/constants/Colors';
import useInvitation from '@/hooks/use-invitation';
import { Platform } from 'react-native';

interface InvitationCardProps {
  checkIfAlreadyInvited: (influencerId: string) => Promise<boolean>;
  data: User;
  headerLeftAction?: () => void;
  headerRightAction?: () => void;
  inviteInfluencer: () => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  checkIfAlreadyInvited,
  data,
  headerLeftAction,
  headerRightAction,
  inviteInfluencer,
}) => {
  const theme = useTheme();
  const {
    isAlreadyInvited,
  } = useInvitation({
    checkIfAlreadyInvited,
    influencerId: data.id,
  });

  return (
    <Card>
      <CardHeader
        avatar={data?.profileImage || ''}
        handle={data.socials?.[0]}
        isVerified={data.isVerified}
        leftAction={headerLeftAction}
        name={data.name}
        rightAction={headerRightAction}
      />
      <Carousel
        containerHeight={data.profile?.attachments?.length === 1 ? (Platform.OS === 'web' ? 560 : 288) : undefined}
        data={data.profile?.attachments?.map((attachment) => processRawAttachment(attachment)) || []}
        theme={theme}
      />
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
            {isAlreadyInvited ? 'Already Invited' : 'Invite'}
          </Button>
        }
      />
      <CardDescription
        text={data.profile?.content?.about || ''}
      />
    </Card>
  );
};

export default InvitationCard;
