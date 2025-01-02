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

interface InvitationCardProps {
  data: User;
  headerLeftAction?: () => void;
  headerRightAction?: () => void;
  inviteInfluencer: () => void;
  isAlreadyInvited: boolean;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  data,
  headerLeftAction,
  headerRightAction,
  inviteInfluencer,
  isAlreadyInvited,
}) => {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        avatar={data?.profileImage || ''}
        handle={data.socials?.[0]}
        leftAction={headerLeftAction}
        name={data.name}
        rightAction={headerRightAction}
        isVerified={data.isVerified}
      />
      <Carousel
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
            onPress={inviteInfluencer}
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
        text="Lorem ipsum dolor sit amet, consectetur piscing elit, sed do eiusmod tempor do eiusmod temp..."
      />
    </Card>
  );
};

export default InvitationCard;
