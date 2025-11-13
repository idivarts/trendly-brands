import React, { useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

import { Collaboration } from "@/types/Collaboration";
import {
  CONTENT_FORMATS,
  INITIAL_CONTENT_FORMATS,
  INITIAL_PLATFORMS,
  PLATFORMS,
} from "@/constants/ItemsList";
import { faArrowRight, faHouseLaptop, faMapLocationDot } from "@fortawesome/free-solid-svg-icons";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { MultiRangeSlider } from "@/shared-uis/components/multislider";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import { Selector } from "@/shared-uis/components/select/selector";
import { View } from "../theme/Themed";
import Button from "../ui/button";
import TextInput from "../ui/text-input";
import Colors from "@/constants/Colors";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import CreateCollaborationMap from "../collaboration/create-collaboration/CreateCollaborationMap";
import ScreenLayout from "./screen-layout";
import { Platform, useWindowDimensions } from "react-native";
import AddressAutocomplete from "../collaboration/create-collaboration/AddressAutocomplete";

interface ScreenTwoProps {
  collaboration: Partial<Collaboration>;
  isEdited: boolean;
  isSubmitting: boolean;
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
  onLocationChange: (
    latlong: { lat: number; long: number },
    address: string,
  ) => void;
  saveAsDraft: () => Promise<void>;
  setCollaboration: React.Dispatch<React.SetStateAction<Partial<Collaboration>>>;
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  type: "Add" | "Edit";
}

const ScreenTwo: React.FC<ScreenTwoProps> = ({
  collaboration,
  isEdited,
  isSubmitting,
  mapRegion,
  onLocationChange,
  saveAsDraft,
  setCollaboration,
  setScreen,
  type,
}) => {
  const theme = useTheme();
  const dimensions = useWindowDimensions();

  const numberOfInfluencersNeededText = useMemo(() => {
    if (
      collaboration.numberOfInfluencersNeeded
      && collaboration.numberOfInfluencersNeeded >= 11
    ) {
      return '>10';
    }

    return `${collaboration.numberOfInfluencersNeeded || 1}`;
  }, [collaboration.numberOfInfluencersNeeded]);

  return (
    <>
      <ScreenLayout
        isEdited={isEdited}
        isSubmitting={isSubmitting}
        saveAsDraft={saveAsDraft}
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
          <MultiSelectExtendable
            buttonIcon={
              <FontAwesomeIcon
                icon={faArrowRight}
                color={Colors(theme).primary}
                size={14}
              />
            }
            buttonLabel="Others"
            initialMultiselectItemsList={INITIAL_CONTENT_FORMATS}
            initialItemsList={includeSelectedItems(CONTENT_FORMATS, collaboration.contentFormat || [])}
            onSelectedItemsChange={(value) => {
              setCollaboration({
                ...collaboration,
                contentFormat: value,
              });
            }}
            selectedItems={collaboration.contentFormat || []}
            theme={theme}
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
          <MultiSelectExtendable
            buttonIcon={
              <FontAwesomeIcon
                icon={faArrowRight}
                color={Colors(theme).primary}
                size={14}
              />
            }
            buttonLabel="Others"
            initialMultiselectItemsList={INITIAL_PLATFORMS}
            initialItemsList={includeSelectedItems(PLATFORMS, collaboration.platform || [])}
            onSelectedItemsChange={(value) => {
              setCollaboration({
                ...collaboration,
                platform: value,
              });
            }}
            selectedItems={collaboration.platform || []}
            theme={theme}
          />
        </ContentWrapper>
        <ContentWrapper
          rightText={numberOfInfluencersNeededText}
          theme={theme}
          title="Influencers Needed"
          titleStyle={{
            fontSize: 16,
          }}
        >
          <TextInput
            label="Number of Influencers"
            placeholder="Minimum 1 influencer"
            keyboardType="number-pad"
            mode="outlined"
            onChangeText={(text) => {
              // Allow empty text so placeholder can show
              if (text === "") {
                setCollaboration({
                  ...collaboration,
                  numberOfInfluencersNeeded: undefined,
                });
                return;
              }

              const value = parseInt(text);
              setCollaboration({
                ...collaboration,
                numberOfInfluencersNeeded: value,
              });
            }}
            value={
              collaboration.numberOfInfluencersNeeded !== undefined
                ? collaboration.numberOfInfluencersNeeded.toString()
                : ""
            }
            style={{
              width: "100%",
            }}
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
                icon: faHouseLaptop,
                label: 'Remote',
                value: 'Remote',
              },
              {
                icon: faMapLocationDot,
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
            <View
              style={{
                gap: 16,
              }}
            >
              <AddressAutocomplete
                collaboration={collaboration}
                mapRegion={mapRegion}
                setCollaboration={setCollaboration}
              />
              <CreateCollaborationMap
                mapRegion={mapRegion.state}
                onLocationChange={onLocationChange}
              />
            </View>
          )
        }

        <Button
          loading={isSubmitting}
          mode="contained"
          onPress={() => {
            setScreen(3);
          }}
        >
          {isSubmitting ? "Saving" : "Next"}
        </Button>
      </ScreenLayout>
    </>
  );
};

export default ScreenTwo;
