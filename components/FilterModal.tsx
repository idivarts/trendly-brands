import React, { useState, useRef, useMemo } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { Text, Chip, Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { stylesFn } from "@/styles/FilterModal.styles";
import { useTheme } from "@react-navigation/native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Colors from "@/constants/Colors";

interface CollaborationFilterProps {
  onClose: () => void;
  setCollaborationType: (collaborationType: string) => void;
  setInfluencerType: (influencerType: string) => void;
  setCurrentFollowersRange: (followersRange: number[]) => void;
  setCurrentReachRange: (reachRange: number[]) => void;
  setCurrentEngagementRange: (engagementRange: number[]) => void;
  collaborationType: any[];
  influencerType: any[];
  currentFollowersRange: number[];
  currentReachRange: number[];
  currentEngagementRange: number[];
  currentCollaborationType: string;
  currentInfluencerType: string;
  isVisible: boolean; // Added to control the visibility of the Bottom Sheet
}

const CollaborationFilter = ({
  onClose,
  setCollaborationType,
  setInfluencerType,
  setCurrentFollowersRange,
  setCurrentReachRange,
  setCurrentEngagementRange,
  collaborationType,
  currentCollaborationType,
  currentInfluencerType,
  influencerType,
  currentFollowersRange,
  currentReachRange,
  currentEngagementRange,
  isVisible, // Handle visibility from the parent component
}: CollaborationFilterProps) => {
  const [localCollaborationType, setLocalCollaborationType] = useState(
    currentCollaborationType || "All"
  );
  const [localInfluencerType, setLocalInfluencerType] = useState(
    currentInfluencerType || "All"
  );
  const [localFollowersRange, setLocalFollowersRange] = useState(
    currentFollowersRange || [0, 1000000]
  );
  const [localReachRange, setLocalReachRange] = useState(
    currentReachRange || [0, 1000000]
  );
  const [localEngagementRange, setLocalEngagementRange] = useState(
    currentEngagementRange || [0, 100]
  );

  const sheetRef = useRef<BottomSheet>(null);

  const applyFilters = () => {
    setCollaborationType(localCollaborationType);
    setInfluencerType(localInfluencerType);
    setCurrentFollowersRange(localFollowersRange);
    setCurrentReachRange(localReachRange);
    setCurrentEngagementRange(localEngagementRange);
    onClose();
    if (sheetRef.current) {
      sheetRef.current.close();
    }
  };

  const theme = useTheme();
  const styles = stylesFn(theme);

  const snapPoints = useMemo(() => ["25%", "50%", "75%", "100%"], []);

  return (
    <BottomSheet
      ref={sheetRef}
      index={isVisible ? 1 : -1} // Controls visibility of BottomSheet
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={(backdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={1}
          pressBehavior="close"
          style={styles.backdrop}
        />
      )}
      onClose={onClose}
    >
      <BottomSheetView style={styles.container}>
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Filter</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors(theme).text} />
            </TouchableOpacity>
          </View>

          {/* Categories Section */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.chipContainer}>
            {influencerType.map((category) => (
              <Chip
                key={category}
                selected={localInfluencerType === category}
                onPress={() => setLocalInfluencerType(category)}
                style={styles.chip}
              >
                {category}
              </Chip>
            ))}
          </View>

          {/* Follower Section */}
          <Text style={styles.sectionTitle}>Followers</Text>
          <View style={styles.salaryContainer}>
            <Text style={styles.salaryLabel}>
              Min Followers: {localFollowersRange[0].toLocaleString() || "0"}
            </Text>
          </View>
          <View style={styles.salaryContainer}>
            <Text style={styles.salaryLabel}>
              Max Followers: {localFollowersRange[1].toLocaleString() || "0"}
            </Text>
            <MultiSlider
              values={localFollowersRange}
              sliderLength={300}
              onValuesChange={(values) => setLocalFollowersRange(values)}
              min={0}
              max={1000000}
              step={1000}
              allowOverlap
              snapped
            />
          </View>

          <Text style={styles.sectionTitle}>Reach</Text>
          <View style={styles.salaryContainer}>
            <Text style={styles.salaryLabel}>
              Min Reach: {localFollowersRange[0].toLocaleString() || "0"}
            </Text>
          </View>
          <View style={styles.salaryContainer}>
            <Text style={styles.salaryLabel}>
              Max Reach: {localFollowersRange[1].toLocaleString() || "0"}
            </Text>
            <MultiSlider
              values={localReachRange}
              sliderLength={300}
              onValuesChange={(values) => setLocalReachRange(values)}
              min={0}
              max={1000000}
              step={1000}
              allowOverlap
              snapped
            />
          </View>

          <Text style={styles.sectionTitle}>Engagement</Text>
          <View style={styles.salaryContainer}>
            <Text style={styles.salaryLabel}>
              Min Engagement: {localEngagementRange[0].toLocaleString() || "0"}
            </Text>
          </View>
          <View style={styles.salaryContainer}>
            <Text style={styles.salaryLabel}>
              Max Engagement: {localEngagementRange[1].toLocaleString() || "0"}
            </Text>
            <MultiSlider
              values={localEngagementRange}
              sliderLength={300}
              onValuesChange={(values) => setLocalEngagementRange(values)}
              min={0}
              max={1000000}
              step={1000}
              allowOverlap
              snapped
            />
          </View>

          <Text style={styles.sectionTitle}>Job Types</Text>
          <View style={styles.chipContainer}>
            {collaborationType.map((jobType) => (
              <Chip
                key={jobType}
                selected={localCollaborationType === jobType}
                onPress={() => setLocalCollaborationType(jobType)}
                style={styles.chip}
              >
                {jobType}
              </Chip>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={applyFilters}
            style={styles.applyButton}
          >
            Apply Filters
          </Button>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default CollaborationFilter;