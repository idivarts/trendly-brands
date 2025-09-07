import React from 'react';

import { Card } from '@/components/ui/card/tertiary';
import { CardHeader } from '@/components/ui/card/tertiary/card-header';
import { CardQuestions } from '@/components/ui/card/tertiary/card-questions';
import { useBreakpoints } from '@/hooks';
import ScrollMedia from '@/shared-uis/components/carousel/scroll-media';
import { Application } from '@/types/Collaboration';
import { processRawAttachment } from '@/utils/attachments';
import { useTheme } from '@react-navigation/native';
import { ApplicationActionBar } from '../../../shared-uis/components/application-action-card';

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
  const { xl } = useBreakpoints();

  return (
    <Card>
      <CardHeader
        title="Application"
        description={data.message}
      />
      {
        data.attachments && data.attachments.length > 0 && (
          <ScrollMedia MAX_WIDTH_WEB={"100%"}
            media={data.attachments.map(v => processRawAttachment(v))}
            xl={xl}
            theme={theme} />
        )
      }
      {
        data.answersFromInfluencer && data.answersFromInfluencer.length > 0 && (
          <CardQuestions
            questions={questions}
          />
        )
      }
      <ApplicationActionBar application={data} onAccept={onAccept} onReject={onReject} />
    </Card>
  );
}
