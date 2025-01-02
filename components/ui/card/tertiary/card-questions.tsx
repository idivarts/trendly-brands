import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Question = {
  question: number;
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
    color: '#111827',
    marginBottom: 8,
  },
  answer: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});
