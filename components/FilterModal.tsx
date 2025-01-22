import React, { useState, useRef, useMemo } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { Text, Chip } from "react-native-paper";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { faCheckDouble, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

import { stylesFn } from "@/styles/FilterModal.styles";
import Colors from "@/constants/Colors";
import Button from "./ui/button";

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
    <>
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
        handleStyle={{
          backgroundColor: Colors(theme).background,
        }}
        handleIndicatorStyle={{
          backgroundColor: Colors(theme).text,
        }}
      >
        <BottomSheetView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter</Text>

            <TouchableOpacity onPress={onClose}>
              <FontAwesomeIcon
                color={Colors(theme).text}
                icon={faClose}
                size={24}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{
              flex: 1,
            }}
            contentContainerStyle={{
              padding: 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Categories Section */}
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.chipContainer}>
              {influencerType.map((category, index) => (
                <Chip
                  icon={() => localInfluencerType === category ? (
                    <FontAwesomeIcon
                      color={Colors(theme).text}
                      icon={faCheckDouble}
                      size={14}
                    />
                  ) : null}
                  key={index}
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
                selectedStyle={{
                  backgroundColor: Colors(theme).primary,
                }}
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
                selectedStyle={{
                  backgroundColor: Colors(theme).primary,
                }}
              />
            </View>

            <Text style={styles.sectionTitle}>Engagement</Text>
            <View style={styles.salaryContainer}>
              <Text style={styles.salaryLabel}>
                Min Engagement:{" "}
                {localEngagementRange[0].toLocaleString() || "0"}
              </Text>
            </View>
            <View style={styles.salaryContainer}>
              <Text style={styles.salaryLabel}>
                Max Engagement:{" "}
                {localEngagementRange[1].toLocaleString() || "0"}
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
                selectedStyle={{
                  backgroundColor: Colors(theme).primary,
                }}
              />
            </View>

            <Text style={styles.sectionTitle}>Job Types</Text>
            <View style={styles.chipContainer}>
              {collaborationType.map((jobType, index) => (
                <Chip
                  key={index}
                  selected={localCollaborationType === jobType}
                  onPress={() => setLocalCollaborationType(jobType)}
                  style={styles.chip}
                >
                  {jobType}
                </Chip>
              ))}
            </View>
            <View
              style={{
                width: "100%",
                padding: 20,
              }}
            >
              <Button
                mode="contained"
                onPress={applyFilters}
              >
                Apply
              </Button>
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

export default CollaborationFilter;
