import Select, { SelectItem } from "@/components/ui/select";
import { Console } from "@/shared-libs/utils/console";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import SelectGroup from "@/shared-uis/components/select/select-group";
import { useTheme } from "@react-navigation/native";
import { FC, useEffect, useState } from "react";
import { ScrollView } from "react-native";

interface PreferencesTabContentProps {
  collaborationId?: string;
}

const PreferencesTabContent: FC<PreferencesTabContentProps> = (props) => {
  const theme = useTheme();
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

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        padding: 16,
        gap: 16
      }}
    >
      <ContentWrapper
        title="Time Commitment"
        description="Match with influencer with your seriousness level"
        theme={theme}
      >
        <SelectGroup
          items={[
            { label: "Full Time", value: "Full Time" },
            { label: "Part Time", value: "Part Time" },
            { label: "Hobby", value: "Hobby" },
          ]}
          selectedItem={timeCommitment}
          onValueChange={(value) => {
            setTimeCommitment(value);
            updateCollaboration("timeCommitment", value.value);
          }}
          theme={theme}
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
  );
};

export default PreferencesTabContent;
