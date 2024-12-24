import { Platform, Pressable, ScrollView } from "react-native";
import { View } from "../theme/Themed";
import ScreenHeader from "../ui/screen-header";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Modal } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import stylesFn from "@/styles/create-collaboration/Screen.styles";
import { useState } from "react";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import Colors from "@/constants/Colors";

interface ScreenLayoutProps {
  children: React.ReactNode;
  screen: number;
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  type: "Add" | "Edit";
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  screen,
  setScreen,
  type,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 8,
      }}
    >
      <ScreenHeader
        action={() => setScreen(screen - 1)}
        hideAction={screen === 1 && (type === "Add" && (Platform.OS === "android" || Platform.OS === "ios"))}
        title={`${type === "Add" ? "Create a" : "Edit"} Collaboration`}
        rightAction={screen !== 1}
        rightActionButton={
          <Pressable
            onPress={() => setIsModalVisible(true)}
            style={{
              marginLeft: 20,
              marginRight: 8,
            }}
          >
            <FontAwesomeIcon
              icon={faClose}
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
        cancelAction={() => setIsModalVisible(false)}
        confirmAction={() => {
          setIsModalVisible(false);
          // setScreen(1);
        }}
        confirmText="Save as Draft"
        cancelText="Discard"
        description="Are you sure you want to discard the changes? You can save as draft instead"
      />
    </View>
  );
};

export default ScreenLayout;
