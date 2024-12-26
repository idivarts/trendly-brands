import { Text, View } from "@/components/theme/Themed";
import EmptyState from "@/components/ui/empty-state";
import Select, { SelectItem } from "@/components/ui/select";
import Colors from "@/constants/Colors";
import SelectGroup from "@/shared-uis/components/select/select-group";
import { useTheme } from "@react-navigation/native";
import { FC, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";

interface SettingsTabContentProps {
  pageID: string;
}

const SettingsTabContent: FC<SettingsTabContentProps> = ({ pageID }) => {
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
      const collabRef = doc(FirestoreDB, "collaborations", pageID);
      await updateDoc(collabRef, {
        [`preferences.${field}`]: value,
      });
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const collabRef = doc(FirestoreDB, "collaborations", pageID);
      const snapshot = await getDoc(collabRef);
      const data = snapshot.data() as ICollaboration;
      if (!data) return;

      setTimeCommitment({
        label: data.preferences.timeCommitment,
        value: data.preferences.timeCommitment,
      });
      setNiches(
        data.preferences.influencerNiche.map((niche) => ({
          label: niche,
          value: niche,
        }))
      );
      setInfluencerLookingFor({
        label: data.preferences.influencerRelation,
        value: data.preferences.influencerRelation,
      });
      setPreferredVideoType({
        label: data.preferences.preferredVideoType,
        value: data.preferences.preferredVideoType,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ flex: 1, padding: 16, gap: 16 }}>
      <View
        style={{
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          Time Commitment
        </Text>
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

        <Text
          style={{
            fontSize: 14,
            color: theme.dark ? Colors(theme).text : Colors(theme).gray100,
          }}
        >
          Match with influencer with your seriousness level
        </Text>
      </View>
      <View
        style={{
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          Content Niche / Category
        </Text>
        <View
          style={{
            marginBottom: 90,
          }}
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
            selectItemStyle={{
              height: 40,
            }}
            style={{
              marginBottom: 16,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 14,
            color: theme.dark ? Colors(theme).text : Colors(theme).gray100,
          }}
        >
          This would help us understand what type of content you create and also
          better match with influencers
        </Text>
      </View>
      <View
        style={{
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          Influencer's looking for
        </Text>
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

        <Text
          style={{
            fontSize: 14,
            color: theme.dark ? Colors(theme).text : Colors(theme).gray100,
          }}
        >
          What kind of relation you are looking for with the brands
        </Text>
      </View>
      <View
        style={{
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          Your Preferred Video Type
        </Text>
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

        <Text
          style={{
            fontSize: 14,
            color: theme.dark ? Colors(theme).text : Colors(theme).gray100,
          }}
        >
          Do you want your content to be integrated or dedicated focusing on
          your brand or product
        </Text>
      </View>
    </ScrollView>
  );
};

export default SettingsTabContent;
