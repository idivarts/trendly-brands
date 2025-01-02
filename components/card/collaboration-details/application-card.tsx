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
import { processRawAttachment } from '@/utils/attachments';
import { Attachment } from '@/shared-libs/firestore/trendly-pro/constants/attachment';
import { InfluencerApplication } from '@/types/Collaboration';
import { formatDistanceToNow } from "date-fns";
import { convertToKUnits } from '@/utils/conversion';

interface ApplicationCardProps {
  acceptApplication: () => void;
  data: InfluencerApplication;
  headerLeftAction?: () => void;
  headerRightAction?: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  acceptApplication,
  data,
  headerLeftAction,
  headerRightAction,
}) => {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        avatar={data.influencer.profileImage || ''}
        handle={data.influencer.socials?.[0]}
        isVerified={data.influencer.isVerified}
        leftAction={headerLeftAction}
        name={data.influencer.name}
        rightAction={headerRightAction}
        timestamp={formatDistanceToNow(data.application.timeStamp, { addSuffix: true })}
      />
      <Carousel
        data={data.application.attachments.map((attachment: Attachment) => processRawAttachment(attachment))}
        theme={theme}
      />
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
            onPress={acceptApplication}
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
        text={data.application.message}
      />
      <CardFooter
        quote={convertToKUnits(Number(data.application.quotation)) as string}
        timeline={new Date(data.application.timeline).toLocaleDateString('en-US')}
      />
    </Card>
  );
};
