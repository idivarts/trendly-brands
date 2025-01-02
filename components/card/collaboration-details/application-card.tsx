import React from 'react';
import Button from '../../ui/button';
import Carousel from '@/shared-uis/components/carousel/carousel';
import { useTheme } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/card/secondary';
import { CardHeader } from '@/components/ui/card/secondary/card-header';
import { CardActions } from '@/components/ui/card/secondary/card-actions';
import { CardDescription } from '@/components/ui/card/secondary/card-description';
import { CardFooter } from '@/components/ui/card/secondary/card-footer';

interface ApplicationCardProps {
  data: any;
  headerLeftAction?: () => void;
  headerRightAction?: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  data,
  headerLeftAction,
  headerRightAction,
}) => {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        avatar=""
        handle="@trendly.pro"
        isVerified
        leftAction={headerLeftAction}
        name={data?.name}
        rightAction={headerRightAction}
        timestamp="5s ago"
      />
      <Carousel
        data={data.attachments}
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
            size="small"
            onPress={() => console.log('Accept pressed')}
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
            Accept
          </Button>
        }
      />
      <CardDescription
        text="Lorem ipsum dolor sit amet, consectetur piscing elit, sed do eiusmod tempor do eiusmod temp..."
      />
      <CardFooter
        quote="Rs 10k"
        timeline="25th Dec"
      />
    </Card>
  );
};
