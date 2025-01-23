import React, { useState } from 'react';

import { Card } from '@/components/ui/card/tertiary';
import { CardHeader } from '@/components/ui/card/tertiary/card-header';
import { CardMetaData } from '@/components/ui/card/tertiary/card-metadata';
import { CardFiles } from '@/components/ui/card/tertiary/card-files';
import { CardFooter } from '@/components/ui/card/tertiary/card-footer';
import { CardQuestions } from '@/components/ui/card/tertiary/card-questions';
import { View } from '@/components/theme/Themed';
import Button from '@/components/ui/button';
import { Application } from '@/types/Collaboration';
import { convertToKUnits } from '@/utils/conversion';
import Colors from '@/constants/Colors';
import { useTheme } from '@react-navigation/native';

interface ApplicationCardProps {
  data: Application;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  questions: {
    question: string;
    answer: string;
  }[];
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  data,
  onAccept,
  onReject,
  questions,
}) => {
  const theme = useTheme();
  const [acceptingApplication, setAcceptingApplication] = useState(false);
  const [rejectingApplication, setRejectingApplication] = useState(false);

  return (
    <Card>
      <CardHeader
        title="Application"
        description={data.message}
      />
      {
        (data.quotation || data.timeline) && (
          <CardMetaData
            quote={convertToKUnits(Number(data.quotation)) as string}
            timeline={new Date(data.timeline).toLocaleDateString('en-US')}
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
            questions={questions}
          />
        )
      }
      {
        data?.status === 'pending' && (
          <CardFooter
            footerActions={
              <View
                style={{
                  backgroundColor: Colors(theme).transparent,
                  flexDirection: 'row',
                  gap: 12,
                  justifyContent: 'center',
                }}
              >
                <Button
                  style={{
                    borderColor: Colors(theme).primary,
                  }}
                  textColor={Colors(theme).primary}
                  loading={rejectingApplication}
                  mode="outlined"
                  onPress={() => {
                    setRejectingApplication(true);
                    onReject().then(() => {
                      setRejectingApplication(false);
                    })
                  }}
                  size="small"
                >
                  Reject Application
                </Button>
                <Button
                  style={{
                    backgroundColor: Colors(theme).primary,
                  }}
                  onPress={() => {
                    setAcceptingApplication(true);
                    onAccept().then(() => {
                      setAcceptingApplication(false);
                    });
                  }}
                  loading={acceptingApplication}
                  size="small"
                >
                  Accept Application
                </Button>
              </View>
            }
          />
        )
      }
    </Card>
  );
}
