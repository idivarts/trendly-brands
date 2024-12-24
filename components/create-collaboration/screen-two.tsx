import { ScrollView } from "react-native";
import React from "react";
import { View } from "../theme/Themed";
import { Modal } from "react-native-paper";
import CreateCollaborationMap from "../collaboration/create-collaboration/CreateCollaborationMap";
import Button from "../ui/button";

import stylesFn from "@/styles/create-collaboration/Screen.styles";
import { useTheme } from "@react-navigation/native";
import ScreenHeader from "../ui/screen-header";
import Select from "../ui/select";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import { Selector } from "@/shared-uis/components/select/selector";
import { faPhotoFilm, faVideo } from "@fortawesome/free-solid-svg-icons";
import { MultiRangeSlider } from "@/shared-uis/components/multislider";
import { Collaboration } from "@/types/Collaboration";
import { useState } from "react";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import TextInput from "../ui/text-input";
import ScreenLayout from "./screen-layout";

interface ScreenTwoProps {
  collaboration: Partial<Collaboration>;
  mapRegion: {
    state: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    setState: React.Dispatch<React.SetStateAction<{
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }>>;
  };
  onFormattedAddressChange: (address: string) => void;
  setCollaboration: React.Dispatch<React.SetStateAction<Partial<Collaboration>>>;
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  type: "Add" | "Edit";
}

const ScreenTwo: React.FC<ScreenTwoProps> = ({
  collaboration,
  mapRegion,
  onFormattedAddressChange,
  setCollaboration,
  setScreen,
  type,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [externalLink, setExternalLink] = useState({
    name: "",
    link: "",
  });

  const handleAddExternalLink = () => {
    if (!externalLink.name || !externalLink.link) {
      Toaster.error("Please fill all fields");
      return;
    }

    setCollaboration({
      ...collaboration,
      externalLinks: [
        ...collaboration.externalLinks || [],
        {
          name: externalLink.name,
          link: externalLink.link,
        },
      ],
    });
    setIsModalVisible(false);
    setExternalLink({
      name: "",
      link: "",
    });
  }

  return (
    <>
      <ScreenLayout
        screen={2}
        setScreen={setScreen}
        type={type}
      >
        <ContentWrapper
          description="Which content format are you willing to post on your social media account for promotions."
          theme={theme}
          title="Content Format"
          titleStyle={{
            fontSize: 16,
          }}
        >
          <Select
            items={[
              { label: 'Posts', value: 'Posts' },
              { label: 'Reels', value: 'Reels' },
              { label: 'Stories', value: 'Stories' },
              { label: 'Live', value: 'Live' },
              { label: 'Product Reviews', value: 'Product Reviews' },
            ]}
            selectItemIcon={true}
            value={collaboration.contentFormat?.map((item) => ({
              label: item,
              value: item,
            })) || []}
            multiselect
            onSelect={(item) => {
              setCollaboration({
                ...collaboration,
                contentFormat: item.map((item) => item.value),
              });
            }}
          />
        </ContentWrapper>
        <ContentWrapper
          description="Which platforms would you like to post content on?"
          theme={theme}
          title="Platform"
          titleStyle={{
            fontSize: 16,
          }}
        >
          <Select
            items={[
              { label: 'Instagram', value: 'Instagram' },
              { label: 'Facebook', value: 'Facebook' },
              { label: 'YouTube', value: 'YouTube' },
              { label: 'LinkedIn', value: 'LinkedIn' },
              { label: 'Others', value: 'Others' },
            ]}
            selectItemIcon={true}
            value={collaboration.platform?.map((item) => ({
              label: item,
              value: item,
            })) || []}
            multiselect
            onSelect={(item) => {
              setCollaboration({
                ...collaboration,
                platform: item.map((item) => item.value),
              });
            }}
          />
        </ContentWrapper>
        <ContentWrapper
          rightText={'1'}
          theme={theme}
          title="Influencers Needed"
          titleStyle={{
            fontSize: 16,
          }}
        >
          <MultiRangeSlider
            minValue={0}
            maxValue={100}
            onValuesChange={(values) => {
              setCollaboration({
                ...collaboration,
                numberOfInfluencersNeeded: values[0],
              });
            }}
            sliderLength={368}
            customMarkerRight={(e) => {
              return (
                <View
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 100,
                    height: 0,
                    width: 0,
                  }}
                />
              );
            }}
            values={[collaboration.numberOfInfluencersNeeded || 0, 100]}
            step={1}
            theme={theme}
          />
        </ContentWrapper>
        <ContentWrapper
          theme={theme}
          title="Location"
          titleStyle={{
            fontSize: 16,
          }}
        >
          <Selector
            options={[
              {
                icon: faVideo,
                label: 'Remote',
                value: 'Remote',
              },
              {
                icon: faPhotoFilm,
                label: 'On-Site',
                value: 'On-Site',
              },
            ]}
            onSelect={(value) => {
              setCollaboration({
                ...collaboration,
                location: {
                  ...collaboration.location,
                  type: value,
                },
              })
            }}
            selectedValue={collaboration.location?.type || 'Remote'}
            theme={theme}
          />
        </ContentWrapper>
        {
          collaboration.location?.type === "On-Site" && (
            <>
              <TextInput
                label="Location"
                mode="outlined"
                onChangeText={(text) => {
                  setCollaboration({
                    ...collaboration,
                    location: {
                      ...collaboration.location,
                      type: collaboration.location?.type as string,
                      name: text || "",
                    },
                  })
                }}
                value={collaboration.location?.name}
              />
              <CreateCollaborationMap
                mapRegion={mapRegion.state}
                onMapRegionChange={(region) => mapRegion.setState(region)}
                onFormattedAddressChange={onFormattedAddressChange}
              />
            </>
          )
        }

        <Button
          mode="contained"
          onPress={() => {
            // if (
            //   !collaboration.contentFormat ||
            //   !collaboration.platform ||
            //   !collaboration.numberOfInfluencersNeeded ||
            //   !collaboration.location?.type ||
            //   !collaboration.location
            // ) {
            //   Toaster.error("Please fill all fields");
            //   return;
            // }
            setScreen(3);
          }}
        >
          Next
        </Button>
      </ScreenLayout>

      <Modal
        contentContainerStyle={styles.modalContainer}
        onDismiss={() => {
          setIsModalVisible(false);
        }}
        visible={isModalVisible}
      >
        <></>
      </Modal>
    </>
  );
};

export default ScreenTwo;
