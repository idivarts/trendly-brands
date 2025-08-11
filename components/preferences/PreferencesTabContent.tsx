import Select from "@/components/ui/select";
import { INFLUENCER_CATEGORIES, INITIAL_LANGUAGES, LANGUAGES, PLATFORMS } from "@/constants/ItemsList";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { COLLABORATION_TYPES } from "@/shared-constants/preferences/collab-type";
import { CITIES, POPULAR_CITIES } from "@/shared-constants/preferences/locations";
import { POST_TYPES } from "@/shared-constants/preferences/post-types";
import { TIME_COMMITMENTS } from "@/shared-constants/preferences/time-commitment";
import { VIDEO_TYPE } from "@/shared-constants/preferences/video-type";
import { Console } from "@/shared-libs/utils/console";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Brand } from "@/types/Brand";
import { faArrowRight, faLocation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { FC, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Button from "../ui/button";

interface PreferencesTabContentProps {
  collaborationId?: string;
}

const PreferencesTabContent: FC<PreferencesTabContentProps> = (props) => {
  const theme = useTheme();
  const {
    updateBrand,
    selectedBrand,
    isOnFreeTrial
  } = useBrandContext();
  const [loading, setLoading] = useState(false)
  const { openModal } = useConfirmationModel()
  const router = useMyNavigation()

  const defaultPreferences = {
    promotionType: [],
    influencerCategories: [],
    platforms: [],
    timeCommitments: [],
    collaborationPostTypes: [],
    contentVideoType: [],
    locations: [],
    languages: [],
  }
  const [preferences, setPreferences] = useState<Brand["preferences"]>(defaultPreferences);

  useEffect(() => {
    if (selectedBrand) {
      Console.log("Selected Data", selectedBrand.preferences)
      setPreferences({
        ...defaultPreferences,
        ...selectedBrand.preferences
      })
    }
  }, [selectedBrand])


  const notifyUprade = () => {
    openModal({
      title: "Upgrade to Paid Plan!",
      description: "Setting Brand Preferencese is just member only functionality. Please upgrade the plan now to not lose any data",
      confirmAction: () => {
        router.push("/billing")
      },
      confirmText: "Upgrade Now"
    })
  }
  const updatePreference = async () => {
    if (!selectedBrand)
      return;
    if (isOnFreeTrial) {
      notifyUprade()
      return
    }
    try {
      setLoading(true)
      Console.log("All preferences", preferences)
      await updateBrand(selectedBrand.id, {
        ...selectedBrand,
        preferences
      })
      PersistentStorage.clear("matchmaking_influencers-" + selectedBrand?.id)
      Toaster.success("Preference Saved")
    } catch (error) {
      Toaster.error("Error saving Preferences")
      Console.error(error, "Error updating Firestore");
    } finally {
      setLoading(false)
    }
  };


  if (!selectedBrand || !preferences)
    return <ActivityIndicator />

  return (
    <>
      <ScrollView
        style={{
          flex: 1,
          height: "100%",
          marginTop: 8,
        }}
        contentContainerStyle={{
          // flex: 1,
          padding: 16,
          paddingBottom: 150,
          gap: 42
        }}
      >
        <ContentWrapper
          title="Influencer's Content Niche"
          description="Which content format are you willing to post on your social media account for promotions."
          theme={theme}
        >
          <Select
            items={INFLUENCER_CATEGORIES.map(v => ({ label: v, value: v }))}
            multiselect
            onSelect={(item) => {
              setPreferences({
                ...preferences,
                influencerCategories: item.map((value) => value.value)
              });
            }}
            selectItemIcon
            value={preferences?.influencerCategories?.map((value) => ({ label: value, value })) || []}
          />
        </ContentWrapper>
        <ContentWrapper
          title="Influencer's Location"
          description="From which location do you want your influencer to be. If you have no preference, leave this blank."
          theme={theme}
        >
          {!!preferences?.locations &&
            <MultiSelectExtendable
              buttonIcon={
                <FontAwesomeIcon
                  icon={faLocation}
                  color={Colors(theme).primary}
                  size={14}
                />
              }
              buttonLabel="See Other Options"
              initialItemsList={includeSelectedItems(
                CITIES,
                preferences?.locations
              )}
              initialMultiselectItemsList={includeSelectedItems(
                POPULAR_CITIES,
                preferences.locations
              )}
              onSelectedItemsChange={(values) => {
                setPreferences({
                  ...preferences,
                  locations: values.map(v => v),
                });
              }}
              selectedItems={preferences.locations}
              theme={theme}
            />}
        </ContentWrapper>
        <ContentWrapper
          title="Preferrable Promotion Type"
          description="What type of promotion are you looking for?"
          theme={theme}
        >
          <Select
            items={COLLABORATION_TYPES.map(v => ({ label: v, value: v }))}
            multiselect
            onSelect={(item) => {
              setPreferences({
                ...preferences,
                promotionType: item.map((item) => item.value),
              });
            }}
            selectItemIcon
            value={preferences?.promotionType?.map((value) => ({ label: value, value })) || []}
          />
        </ContentWrapper>
        <ContentWrapper
          title="Influencer's Content Language"
          description="Please tell us in what language do you want influencers to create content in?"
          theme={theme}
        >
          {!!preferences?.languages &&
            <MultiSelectExtendable
              buttonIcon={
                <FontAwesomeIcon
                  icon={faArrowRight}
                  color={Colors(theme).primary}
                  size={14}
                />
              }
              buttonLabel="See All Languages"
              initialItemsList={includeSelectedItems(
                LANGUAGES,
                preferences?.languages || []
              )}
              initialMultiselectItemsList={includeSelectedItems(
                INITIAL_LANGUAGES,
                preferences?.languages || []
              )}
              onSelectedItemsChange={(values) => {
                console.log("Lanugages Changed", values);
                setPreferences({
                  ...preferences,
                  languages: values.map(v => v),
                });
              }}
              selectedItems={preferences?.languages || []}
              theme={theme}
            />}
        </ContentWrapper>

        <ContentWrapper
          title="Social Media Platforms"
          description="Which all social media platform do you wish to promote your brand?"
          theme={theme}
        >
          <Select
            items={PLATFORMS.map(v => ({ label: v, value: v }))}
            multiselect
            onSelect={(item) => {
              setPreferences({
                ...preferences,
                platforms: item.map((item) => item.value),
              });
            }}
            selectItemIcon
            value={preferences?.platforms?.map((value) => ({ label: value, value })) || []}
          />
        </ContentWrapper>

        <ContentWrapper
          title="Influencer's Time Commitment"
          description="Match with influencer with your seriousness level"
          theme={theme}
        >
          <Select
            items={TIME_COMMITMENTS.map(v => ({ label: v, value: v }))}
            multiselect
            onSelect={(item) => {
              setPreferences({
                ...preferences,
                timeCommitments: item.map((item) => item.value),
              });
            }}
            selectItemIcon
            value={preferences?.timeCommitments?.map((value) => ({ label: value, value })) || []}
          />
        </ContentWrapper>

        <ContentWrapper
          title="Collaboration Post Types"
          description="What type of posts do you want your influencers to post when they are a part of your campaign?"
          theme={theme}
        >
          <Select
            items={POST_TYPES.map(v => ({ label: v, value: v }))}
            multiselect
            onSelect={(item) => {
              setPreferences({
                ...preferences,
                collaborationPostTypes: item.map((item) => item.value),
              });
            }}
            selectItemIcon
            value={preferences?.collaborationPostTypes?.map((value) => ({ label: value, value })) || []}
          />
        </ContentWrapper>

        <ContentWrapper
          title="Video Types"
          description="Do you want the shooted video to be integrated video or dedicated video?"
          theme={theme}
        >
          <Select
            items={VIDEO_TYPE.map(v => ({ label: v, value: v }))}
            multiselect
            onSelect={(item) => {
              setPreferences({
                ...preferences,
                contentVideoType: item.map((item) => item.value),
              });
            }}
            selectItemIcon
            value={preferences?.contentVideoType?.map((value) => ({ label: value, value })) || []}
          />
        </ContentWrapper>

      </ScrollView>


      <View style={{
        position: "absolute",
        bottom: 0,
        display: "flex",
        padding: 16,
        width: "100%",
        alignItems: "stretch",
        backgroundColor: Colors(theme).background
      }}>
        <Button style={{ flex: 1, paddingVertical: 4 }} onPress={() => updatePreference()} loading={loading}>Save</Button>
      </View>
    </>
  );
};

export default PreferencesTabContent;
