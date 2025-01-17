import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { View } from "../theme/Themed";
import { useTheme } from "@react-navigation/native";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

import Colors from "@/constants/Colors";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import ScreenHeader from "../ui/screen-header";
import { useRouter } from "expo-router";

interface ScreenLayoutProps {
  children: React.ReactNode;
  isEdited: boolean;
  isSubmitting?: boolean;
  saveAsDraft?: () => Promise<void>;
  screen: number;
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  type: "Add" | "Edit";
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  isEdited,
  isSubmitting,
  screen,
  saveAsDraft,
  setScreen,
  type,
}) => {
  const theme = useTheme();

  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        flex: 1,
        paddingTop: 8,
      }}
    >
      <ScreenHeader
        action={() => {
          if (screen === 1) {
            setIsModalVisible(true);
            router.back();
          } else {
            setScreen(screen - 1);
          }
        }}
        hideAction={screen === 1 && (type === "Add" && (Platform.OS === "android" || Platform.OS === "ios"))}
        title={`${type === "Add" ? "Create a" : "Edit"} Collaboration`}
        rightAction={screen !== 1 && type === "Add"}
        rightActionButton={
          <Pressable
            onPress={() => {
              if (isEdited) {
                setIsModalVisible(true);
              } else {
                router.back();
              }
            }}
            style={{
              marginLeft: 20,
              marginRight: 8,
            }}
          >
            <FontAwesomeIcon
              icon={faXmark}
              size={24}
              color={theme.colors.text}
            />
          </Pressable>
        }
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
      >
        {
          Array.from({ length: 3 }).map((_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 4,
                backgroundColor: screen > index ? Colors(theme).primary : Colors(theme).platinum,
                marginTop: 8,
              }}
            />
          ))
        }
      </View>
      <ScrollView
        style={{
          flex: 1,
          paddingTop: 16,
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingBottom: 32,
          flexGrow: 1,
        }}
      >

        <View
          style={{
            paddingTop: 16,
            gap: 32,
            flexGrow: 1,
          }}
        >
          {children}
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={isModalVisible}
        setVisible={setIsModalVisible}
        cancelAction={() => {
          if (isSubmitting) {
            return;
          }

          router.back();
          setIsModalVisible(false)
        }}
        confirmAction={() => {
          if (isSubmitting) {
            return;
          }

          if (isEdited && saveAsDraft) {
            saveAsDraft().then(() => {
              setIsModalVisible(false);
            });
          } else {
            router.back();
            setIsModalVisible(false);
          }
        }}
        confirmText={isSubmitting ? "Saving..." : "Save as Draft"}
        cancelText="Discard"
        description="Are you sure you want to discard the changes? You can save as draft instead"
      />
    </KeyboardAvoidingView>
  );
};

export default ScreenLayout;
