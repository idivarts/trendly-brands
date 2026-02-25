import { faCheckDouble, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Chip, Text } from "react-native-paper";

import Colors from "@/shared-uis/constants/Colors";
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
    const styles = useMemo(() => useStyles(theme), [theme]);

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
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
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
                        <View style={styles.bottomPadding}>
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

const useStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: Colors(theme).background,
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        title: {
            fontSize: 24,
            color: Colors(theme).text,
            fontWeight: "bold",
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "bold",
            color: Colors(theme).text,
            marginVertical: 10,
        },
        chipContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
        },
        backdrop: {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors(theme).backdrop,
        },
        chip: {
            margin: 5,
        },
        salaryContainer: {
            marginVertical: 10,
        },
        salaryLabel: {
            fontSize: 16,
            color: Colors(theme).text,
            marginBottom: 5,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            padding: 16,
        },
        bottomPadding: {
            width: "100%",
            padding: 20,
        },
    });

export default CollaborationFilter;
