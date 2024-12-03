import { Platform, Pressable, ScrollView } from "react-native";

import { COLLAB_TYPES, PLATFORM_TYPES, PROMOTION_TYPES } from "@/constants/CreateCollaborationForm";
import { Text, View } from "../theme/Themed";
import { Paragraph, TextInput } from "react-native-paper";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";

import stylesFn from "@/styles/modal/UploadModal.styles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import Select, { SelectItem } from "../ui/select";
import Button from "../ui/button";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import React from "react";
import ScreenHeader from "../ui/screen-header";

interface ScreenOneProps {
  type: "Add" | "Edit";
  data: {
    collaborationName: string;
    aboutCollab: string;
    budgetMin: string;
    budgetMax: string;
    numInfluencers: number;
    promotionType: SelectItem[];
    collabType: SelectItem[];
    platform: SelectItem[];
  };
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  setState: {
    collaborationName: React.Dispatch<React.SetStateAction<string>>;
    aboutCollab: React.Dispatch<React.SetStateAction<string>>;
    budgetMin: React.Dispatch<React.SetStateAction<string>>;
    budgetMax: React.Dispatch<React.SetStateAction<string>>;
    numInfluencers: React.Dispatch<React.SetStateAction<number>>;
    promotionType: React.Dispatch<React.SetStateAction<SelectItem[]>>;
    collabType: React.Dispatch<React.SetStateAction<SelectItem[]>>;
    platform: React.Dispatch<React.SetStateAction<SelectItem[]>>;
  };
}

const ScreenOne: React.FC<ScreenOneProps> = ({
  type,
  data,
  setScreen,
  setState,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 16,
          gap: 16,
        }}
        style={styles.container}
      >
        <ScreenHeader
          title={`${type === "Add" ? "Create a" : "Edit"} Collaboration`}
          hideAction={(type === "Add" && (Platform.OS === "android" || Platform.OS === "ios"))}
        />

        <TextInput
          label="Collaboration Name"
          mode="outlined"
          onChangeText={(text) => setState.collaborationName(text)}
          style={styles.input}
          textColor={Colors(theme).text}
          theme={{
            colors: {
              primary: Colors(theme).primary,
              placeholder: Colors(theme).text,
              text: Colors(theme).text,
            },
          }}
          value={data.collaborationName}
        />
        <TextInput
          label="About this Collaboration"
          mode="outlined"
          // multiline
          onChangeText={(text) => setState.aboutCollab(text)}
          style={styles.input}
          textColor={Colors(theme).text}
          value={data.aboutCollab}
        />
        <View style={styles.budgetContainer}>
          <TextInput
            label="Budget Min"
            mode="outlined"
            onChangeText={(text) => setState.budgetMin(text)}
            style={styles.budgetInput}
            textColor={Colors(theme).text}
            value={data.budgetMin}
          />
          <TextInput
            label="Budget Max"
            mode="outlined"
            onChangeText={(text) => setState.budgetMax(text)}
            style={styles.budgetInput}
            textColor={Colors(theme).text}
            value={data.budgetMax}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Paragraph style={styles.paragraph}>
            Number of Influencers Involved:
          </Paragraph>
          <View style={styles.counter}>
            <Pressable
              onPress={() => setState.numInfluencers(Math.max(1, data.numInfluencers - 1))}
              style={styles.iconButton}

            >
              <FontAwesomeIcon
                icon={faMinus}
                color={Colors(theme).white}
              />
            </Pressable>
            <View
              style={styles.iconButtonContent}
            >
              <Text
                style={{
                  color: Colors(theme).primary,
                }}
              >
                {data.numInfluencers}
              </Text>
            </View>
            <Pressable
              onPress={() => setState.numInfluencers(data.numInfluencers + 1)}
              style={styles.iconButton}
            >
              <FontAwesomeIcon
                icon={faPlus}
                color={Colors(theme).white}
              />
            </Pressable>
          </View>
        </View>
        <View
          style={styles.selectContainer}
        >
          <Paragraph style={styles.paragraph}>Promotion Type:</Paragraph>
          <Select
            items={PROMOTION_TYPES}
            onSelect={(selectedItems) => setState.promotionType(selectedItems)}
            value={data.promotionType}
          />
        </View>
        <View
          style={styles.selectContainer}
        >
          <Paragraph style={styles.paragraph}>Collaboration Type:</Paragraph>
          <Select
            items={COLLAB_TYPES}
            onSelect={(selectedItems) => setState.collabType(selectedItems)}
            value={data.collabType}
          />
        </View>
        <View
          style={styles.selectContainer}
        >
          <Paragraph style={styles.paragraph}>Platform:</Paragraph>
          <Select
            items={PLATFORM_TYPES}
            onSelect={(selectedItems) => setState.platform(selectedItems)}
            value={data.platform}
          />
        </View>
        <Button
          mode="contained"
          onPress={() => {
            if (
              !data.collaborationName ||
              !data.aboutCollab ||
              !data.budgetMin ||
              !data.budgetMax ||
              !data.numInfluencers ||
              !data.promotionType ||
              !data.collabType ||
              !data.platform
            ) {
              Toaster.error("Please fill all fields");
              return;
            }
            setScreen(2);
          }}
        >
          Next
        </Button>
      </ScrollView>
    </>
  );
};

export default ScreenOne;
