import React from 'react';

import { Card } from '@/components/ui/card/tertiary';
import { CardHeader } from '@/components/ui/card/tertiary/card-header';
import { CardFooter } from '@/components/ui/card/tertiary/card-footer';
import Button from '@/components/ui/button';

interface InvitationCardProps {
  isInvited: boolean;
  onInvite: () => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  isInvited,
  onInvite,
}) => {
  return (
    <Card>
      <CardHeader
        description="When you invite a user they are notified through email and in-app notification, hence gets a better chance has a better chance to view and apply to your collaboration."
        title="Invite User to Apply"
      />
      <CardFooter
        footerActions={
          <Button
            onPress={onInvite}
            size="small"
            customStyles={{
              width: '100%',
            }}
          >
            {isInvited ? 'Already Invited' : 'Invite Now'}
          </Button>
        }
      />
    </Card>
  );
}
