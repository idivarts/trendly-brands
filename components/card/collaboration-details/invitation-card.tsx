import React from 'react';
import Button from '../../ui/button';
import { Card } from '../../ui/card/secondary';
import { CardHeader } from '../../ui/card/secondary/card-header';
import { CardDescription } from '../../ui/card/secondary/card-description';
import { CardActions } from '../../ui/card/secondary/card-actions';
import Carousel from '@/shared-uis/components/carousel/carousel';
import { useTheme } from '@react-navigation/native';

interface InvitationCardProps {
  data: any;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  data,
}) => {
  const theme = useTheme();
  console.log('Data', data);

  return (
    <Card>
      <CardHeader
        avatar=""
        name="Rahul Sinha"
        handle="@trendly.pro"
        isVerified
        timestamp="5s ago"
      />
      <Carousel
        data={[
          {
            type: 'image',
            url: 'https://picsum.photos/200/300',
          },
          {
            type: 'image',
            url: 'https://picsum.photos/200/320',
          },
          {
            type: 'image',
            url: 'https://picsum.photos/200/330',
          },
        ]}
        theme={theme}
      />
      <CardActions
        metrics={{
          views: 10000,
          likes: 20000,
          comments: 5,
        }}
        action={
          <Button
            mode="outlined"
            onPress={() => console.log('Invite pressed')}
          >
            Invite
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
