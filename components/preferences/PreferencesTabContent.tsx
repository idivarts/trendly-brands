import Select, { SelectItem } from "@/components/ui/select";
import { INFLUENCER_CATEGORIES } from "@/constants/ItemsList";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { COLLABORATION_TYPES } from "@/shared-constants/preferences/collab-type";
import { TIME_COMMITMENTS } from "@/shared-constants/preferences/time-commitment";
import { Console } from "@/shared-libs/utils/console";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import SelectGroup from "@/shared-uis/components/select/select-group";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
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
  } = useBrandContext();

  const [preferences, setPreferences] = useState<Brand["preferences"]>({
    promotionType: [],
    influencerCategories: [],
    languages: [],
    locations: [],
    platforms: [],
    collaborationPostTypes: [],
    timeCommitments: [],
    contentVideoType: [],
  });

  useEffect(() => {
    if (selectedBrand && selectedBrand.preferences) {
      setPreferences({
        ...preferences,
        ...selectedBrand.preferences
      })
    }
  }, [selectedBrand])

  const [timeCommitment, setTimeCommitment] = useState<{
    label: string;
    value: string;
  }>({
    label: "None",
    value: "None",
  });
  const [niches, setNiches] = useState<SelectItem[]>([]);
  const [influencerLookingFor, setInfluencerLookingFor] = useState<{
    label: string;
    value: string;
  }>({
    label: "None",
    value: "None",
  });
  const [preferredVideoType, setPreferredVideoType] = useState<{
    label: string;
    value: string;
  }>({
    label: "None",
    value: "None",
  });

  const handleNicheSelect = (
    selectedOptions: {
      label: string;
      value: string;
    }[]
  ) => {
    setNiches(selectedOptions);
  };

  const updateCollaboration = async (
    field: string,
    value: string | string[]
  ) => {
    try {
      // const collabRef = doc(FirestoreDB, "collaborations", pageID);
      // await updateDoc(collabRef, {
      //   [`preferences.${field}`]: value,
      // });
    } catch (error) {
      Console.error(error, "Error updating Firestore");
    }
  };

  const fetchSettings = async () => {
    try {
      // const collabRef = doc(FirestoreDB, "collaborations", pageID);
      // const snapshot = await getDoc(collabRef);
      // const data = snapshot.data() as ICollaboration;
      // if (!data) return;

      // setTimeCommitment({
      //   label: data.preferences.timeCommitment,
      //   value: data.preferences.timeCommitment,
      // });
      // setNiches(
      //   data.preferences.influencerNiche.map((niche) => ({
      //     label: niche,
      //     value: niche,
      //   }))
      // );
      // setInfluencerLookingFor({
      //   label: data.preferences.influencerRelation,
      //   value: data.preferences.influencerRelation,
      // });
      // setPreferredVideoType({
      //   label: data.preferences.preferredVideoType,
      //   value: data.preferences.preferredVideoType,
      // });
    } catch (e) {
      Console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (!selectedBrand || !selectedBrand.preferences)
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
          title="Influencer Category"
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
          title="Promotion Type"
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
          title="Content Niche / Category"
          description="This would help us understand what type of content you create and also better match with influencers"
          theme={theme}
        >
          <Select
            items={[
              { label: "Fashion", value: "Fashion" },
              { label: "Lifestyle", value: "Lifestyle" },
              { label: "Food", value: "Food" },
              { label: "Travel", value: "Travel" },
              { label: "Health", value: "Health" },
            ]}
            selectItemIcon={true}
            value={niches}
            multiselect
            onSelect={(selectedOptions) => {
              const selectedValues = selectedOptions.map(
                (option) => option.value
              );
              setNiches(selectedOptions);
              updateCollaboration("influencerNiche", selectedValues);
            }}
          />
        </ContentWrapper>
        <ContentWrapper
          title="Influencer's looking for"
          description="What kind of relation you are looking for with the brands"
          theme={theme}
        >
          <SelectGroup
            items={[
              { label: "Long Term", value: "Long Term" },
              { label: "Short Term", value: "Short Term" },
              { label: "One Time", value: "One Time" },
            ]}
            selectedItem={influencerLookingFor}
            onValueChange={(value) => {
              setInfluencerLookingFor(value);
              updateCollaboration("influencerRelation", value.value);
            }}
            theme={theme}
          />
        </ContentWrapper>
        <ContentWrapper
          description="Do you want your content to be integrated or dedicated focusing on your brand or product"
          title="Preferred Video Type"
          theme={theme}
        >
          <SelectGroup
            items={[
              { label: "Integrated Video", value: "Integrated Video" },
              { label: "Dedicated Video", value: "Dedicated Video" },
            ]}
            selectedItem={preferredVideoType}
            onValueChange={(value) => {
              setPreferredVideoType(value);
              updateCollaboration("preferredVideoType", value.value);
            }}
            theme={theme}
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
        <Button style={{ flex: 1, paddingVertical: 4 }}>Save</Button>
      </View>
    </>
  );
};

export default PreferencesTabContent;
