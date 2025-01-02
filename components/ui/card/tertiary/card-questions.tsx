import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { Theme, useTheme } from '@react-navigation/native';

type Question = {
  question: string;
  answer: string;
};

type CardQuestionsProps = {
  questions: Question[];
};

export const CardQuestions = ({ questions }: CardQuestionsProps) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <View style={styles.container}>
      {questions.map((item, index) => (
        <View key={index} style={styles.questionContainer}>
          <Text style={styles.question}>{item.question}</Text>
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      ))}
    </View>
  );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: Colors(theme).transparent,
    gap: 16,
  },
  questionContainer: {
    backgroundColor: Colors(theme).transparent,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  answer: {
    fontSize: 16,
    lineHeight: 24,
  },
});
