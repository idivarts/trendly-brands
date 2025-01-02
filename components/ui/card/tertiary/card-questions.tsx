import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from '@/components/theme/Themed';

type Question = {
  question: string;
  answer: string;
};

type CardQuestionsProps = {
  questions: Question[];
};

export const CardQuestions = ({ questions }: CardQuestionsProps) => {
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

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  questionContainer: {
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
