import { ScrollView } from "react-native";
import { View } from "../theme/Themed";
import { Modal, Paragraph, RadioButton, TextInput } from "react-native-paper";
import Colors from "@/constants/Colors";
import CreateCollaborationMap from "../collaboration/create-collaboration/CreateCollaborationMap";
import Button from "../ui/button";

import stylesFn from "@/styles/modal/UploadModal.styles";
import { useTheme } from "@react-navigation/native";
import ScreenHeader from "../ui/screen-header";

interface ScreenTwoProps {
  type: "Add" | "Edit";
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  data: {
    location: string;
    links: any[];
    mapRegion: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    newLinkName: string;
    newLinkUrl: string;
  };
  setState: {
    location: React.Dispatch<React.SetStateAction<string>>;
    links: React.Dispatch<React.SetStateAction<any[]>>;
    mapRegion: React.Dispatch<React.SetStateAction<{
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }>>;
    newLinkName: React.Dispatch<React.SetStateAction<string>>;
    newLinkUrl: React.Dispatch<React.SetStateAction<string>>;
  };
  isModalVisible: boolean;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  onFormattedAddressChange: (address: string) => void;
  submitCollaboration: () => void;
  addLink: () => void;
}

const ScreenTwo: React.FC<ScreenTwoProps> = ({
  type,
  setScreen,
  data,
  setState,
  isModalVisible,
  setIsModalVisible,
  onFormattedAddressChange,
  submitCollaboration,
  addLink,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <ScreenHeader
          title={`${type === "Add" ? "Create a" : "Edit"} Collaboration`}
          action={() => setScreen(1)}
        />

        <View>
          <Paragraph
            style={[
              styles.paragraph,
              {
                paddingLeft: 16,
              }
            ]}
          >
            Location:
          </Paragraph>
          <RadioButton.Group
            onValueChange={(newValue) => setState.location(newValue)}
            value={data.location}
          >
            <RadioButton.Item
              mode="android"
              label="Remote"
              value="Remote"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
            <RadioButton.Item
              mode="android"
              label="Physical"
              value="Physical"
              labelStyle={{
                color: Colors(theme).text,
              }}
            />
          </RadioButton.Group>
        </View>

        {
          data.location === "Physical" && (
            <CreateCollaborationMap
              mapRegion={data.mapRegion}
              onMapRegionChange={(region) => setState.mapRegion(region)}
              onFormattedAddressChange={onFormattedAddressChange}
            />
          )
        }

        <Button
          mode="contained"
          onPress={() => setIsModalVisible(true)}
          style={{
            marginBottom: 16,
          }}
        >
          Add Link
        </Button>
        {
          data.links.map((link, index) => (
            <Paragraph key={index + link.url}>
              {link.name}: {link.url}
            </Paragraph>
          ))
        }

        <Button mode="contained" onPress={() => submitCollaboration()}>
          {type === "Add" ? "Post" : "Update"}
        </Button>
      </ScrollView>

      <Modal
        contentContainerStyle={styles.modalContainer}
        onDismiss={() => setIsModalVisible(false)}
        visible={isModalVisible}
      >
        <TextInput
          label="Link Name"
          mode="outlined"
          onChangeText={setState.newLinkName}
          style={styles.input}
          value={data.newLinkName}
        />
        <TextInput
          label="Link URL"
          mode="outlined"
          onChangeText={setState.newLinkUrl}
          style={styles.input}
          value={data.newLinkUrl}
        />
        <Button
          mode="contained"
          onPress={addLink}
        >
          Add Link
        </Button>
      </Modal>
    </>
  );
};

export default ScreenTwo;
