import React from 'react';

import { Card } from '@/components/ui/card/tertiary';
import { CardHeader } from '@/components/ui/card/tertiary/card-header';
import { CardMetaData } from '@/components/ui/card/tertiary/card-metadata';
import { CardFiles } from '@/components/ui/card/tertiary/card-files';
import { CardFooter } from '@/components/ui/card/tertiary/card-footer';
import { CardQuestions } from '@/components/ui/card/tertiary/card-questions';
import { View } from '@/components/theme/Themed';
import Button from '@/components/ui/button';

interface ApplicationCardProps {
  onAccept: () => void;
  onReject: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  onAccept,
  onReject,
}) => {
  const files = [
    { name: 'My File One.txt', type: 'txt' },
    { name: 'My File two.pdf', type: 'pdf' },
  ];

  const questions = [
    {
      question: 'How much reach can you guarantee?',
      answer: 'I can guarantee a reach of 20k in one week, if we are doing an integrated video for this',
    },
    {
      question: 'Have you done any similar collaboration in past? If so please share link?',
      answer: 'Yes I have done a similar collab for one more brand in the same field. You can check that out on my insta profile. Also attanching screenshot',
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Application"
        description="Lorem ipsum dolor sit amet, consectetur piscing elit, sed do eiusmod tempor do eiusmod temp Lorem dolor sit amet, consectetur piscing elit, sed do eiusmod"
      />
      <CardMetaData
        quote="Rs 10k"
        timeline="25th Dec"
      />
      <CardFiles
        files={files}
        onFilePress={(file) => console.log('File pressed:', file.name)}
      />
      <CardQuestions questions={questions} />
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
