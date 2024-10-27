import BackButton from "@/components/ui/back-button/BackButton";
import AppLayout from "@/layouts/app-layout";
import { stylesFn } from "@/styles/CollaborationHistory.styles";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  IconButton,
  RadioButton,
} from "react-native-paper";

const CreateCollaborationScreen = () => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  return (
    <AppLayout>
      <ScrollView style={styles.container}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            gap: 16,
          }}
        >
          <BackButton />
          <Title style={styles.title}>Collaboration History</Title>
        </View>
      </ScrollView>
    </AppLayout>
  );
};

export default CreateCollaborationScreen;
