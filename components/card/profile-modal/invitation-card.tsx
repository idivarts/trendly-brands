import React from 'react';

import { Card } from '@/components/ui/card/tertiary';
import { CardHeader } from '@/components/ui/card/tertiary/card-header';
import { CardFooter } from '@/components/ui/card/tertiary/card-footer';
import Button from '@/components/ui/button';
import useInvitation from '@/hooks/use-invitation';
import Colors from '@/constants/Colors';
import { useTheme } from '@react-navigation/native';

interface InvitationCardProps {
  checkIfAlreadyInvited: (influencerId: string) => Promise<boolean>;
  influencerId: string | undefined;
  onInvite: () => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  checkIfAlreadyInvited,
  influencerId,
  onInvite,
}) => {
  const {
    isAlreadyInvited,
  } = useInvitation({
    checkIfAlreadyInvited,
    influencerId: influencerId,
  });

  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        description="When you invite a user they are notified through email and in-app notification, hence gets a better chance has a better chance to view and apply to your collaboration."
        title="Invite User to Apply"
      />
      <CardFooter
        footerActions={
          <Button
            onPress={() => {
              if (!isAlreadyInvited) {
                onInvite();
              }
            }}
            size="small"
            customStyles={{
              width: '100%',
              backgroundColor: Colors(theme).primary,
            }}
          >
            {isAlreadyInvited ? 'Already Invited' : 'Invite Now'}
          </Button>
        }
      />
    </Card>
  );
}
