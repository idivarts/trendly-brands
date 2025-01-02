import React from 'react';

import { Card } from '@/components/ui/card/tertiary';
import { CardHeader } from '@/components/ui/card/tertiary/card-header';
import { CardMetaData } from '@/components/ui/card/tertiary/card-metadata';
import { CardFiles } from '@/components/ui/card/tertiary/card-files';
import { CardFooter } from '@/components/ui/card/tertiary/card-footer';
import { CardQuestions } from '@/components/ui/card/tertiary/card-questions';
import { View } from '@/components/theme/Themed';
import Button from '@/components/ui/button';
import { Application } from '@/types/Collaboration';

interface ApplicationCardProps {
  data: Application;
  onAccept: () => void;
  onReject: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  data,
  onAccept,
  onReject,
}) => {
  return (
    <Card>
      <CardHeader
        title="Application"
        description={data.message}
      />
      {
        (data.quotation || data.timeline) && (
          <CardMetaData
            quote={data.quotation}
            timeline={data.timeline}
          />
        )
      }
      {
        data.fileAttachments && data.fileAttachments.length > 0 && (
          <CardFiles
            files={data.fileAttachments}
            onFilePress={(file) => console.log('File pressed:', file.name)}
          />
        )
      }
      {
        data.answersFromInfluencer && data.answersFromInfluencer.length > 0 && (
          <CardQuestions
            questions={data.answersFromInfluencer}
          />
        )
      }
      <CardFooter
        footerActions={
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Button
              mode="outlined"
              size="small"
              onPress={onReject}
            >
              Reject Application
            </Button>
            <Button
              size="small"
              onPress={onAccept}
            >
              Accept Application
            </Button>
          </View>
        }
      />
    </Card>
  );
}
