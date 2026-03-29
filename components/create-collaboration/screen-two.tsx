import Colors from "@/shared-uis/constants/Colors";
import {
    INITIAL_PLATFORMS,
    PLATFORMS,
} from "@/constants/ItemsList";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import { Selector } from "@/shared-uis/components/select/selector";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { CollaborationLocationType } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Collaboration } from "@/types/Collaboration";
import {
    faArrowRight,
    faBox,
    faHouseLaptop,
    faMapLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useMemo } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import AddressAutocomplete from "../collaboration/create-collaboration/AddressAutocomplete";
import CreateCollaborationMap from "../collaboration/create-collaboration/CreateCollaborationMap";
import { View } from "../theme/Themed";
import Button from "../ui/button";
import TextInput from "../ui/text-input";
import ScreenLayout from "./screen-layout";

interface ScreenTwoProps {
    collaboration: Partial<Collaboration>;
    headerRight?: React.ReactNode;
    isEdited: boolean;
    isSubmitting: boolean;
    mapRegion: {
        state: {
            latitude: number;
            longitude: number;
            latitudeDelta: number;
            longitudeDelta: number;
        };
        setState: React.Dispatch<
            React.SetStateAction<{
                latitude: number;
                longitude: number;
                latitudeDelta: number;
                longitudeDelta: number;
            }>
        >;
    };
    onLocationChange: (
        latlong: { lat: number; long: number },
        address: string
    ) => void;
    saveAsDraft: () => Promise<void>;
    setCollaboration: React.Dispatch<
        React.SetStateAction<Partial<Collaboration>>
    >;
    setScreen: React.Dispatch<React.SetStateAction<number>>;
    type: "Add" | "Edit";
}

const ScreenTwo: React.FC<ScreenTwoProps> = ({
    collaboration,
    headerRight,
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
    const styles = useMemo(() => createStyles(theme), [theme]);

    const numberOfInfluencersNeededText = useMemo(() => {
        if (
            collaboration.numberOfInfluencersNeeded &&
            collaboration.numberOfInfluencersNeeded >= 11
        ) {
            return ">10";
        }

        return `${collaboration.numberOfInfluencersNeeded || 1}`;
    }, [collaboration.numberOfInfluencersNeeded]);

    const handleLocationSelect = async (value: CollaborationLocationType) => {
        if (value === CollaborationLocationType.OnSite) {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert(
                        "Location Services Disabled",
                        "Precise location is required to facilitate secure on-site collaborations. Please enable Location Services in your System Settings to continue.",
                    );
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                mapRegion.setState((prev) => ({
                    ...prev,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                }));
            } catch {
                Alert.alert(
                    "Location Services Disabled",
                    "Precise location is required to facilitate secure on-site collaborations. Please enable Location Services in your System Settings to continue.",
                );
                return;
            }
        }

        setCollaboration({
            ...collaboration,
            location: {
                ...collaboration.location,
                type: value,
            },
        });
    };

    return (
        <>
            <ScreenLayout
                headerRight={headerRight}
                isEdited={isEdited}
                isSubmitting={isSubmitting}
                saveAsDraft={saveAsDraft}
                screen={2}
                setScreen={setScreen}
                type={type}
            >
                <ContentWrapper
                    description="Which platforms would you like to post content on?"
                    theme={theme}
                    title="Platform"
                    titleStyle={styles.sectionTitle}
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
                        closeOnSelect
                        initialMultiselectItemsList={INITIAL_PLATFORMS}
                        initialItemsList={includeSelectedItems(
                            PLATFORMS,
                            collaboration.platform || []
                        )}
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
                    titleStyle={styles.sectionTitle}
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

                            const numericText = text.replace(/\D/g, "");
                            if (numericText === "") {
                                return;
                            }
                            const value = Math.max(1, parseInt(numericText, 10));
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
                        style={styles.textInputFullWidth}
                    />
                </ContentWrapper>
                <ContentWrapper
                    theme={theme}
                    title="What are you promoting?"
                    titleStyle={styles.sectionTitle}
                >
                    <Selector
                        options={[
                            {
                                label: "Physical Product",
                                value: "physical_product",
                                description: "Any product based items like Beauty cream, shirts and so on.",
                            },
                            {
                                label: "Services",
                                value: "services",
                                description: "Any professional services like Spa or Nail or any other digital services like SaaS Product",
                            },
                            {
                                label: "Others",
                                value: "others",
                                description: "Any other thing like maybe food/restaurant promotion, store promotion.",
                            },
                        ]}
                        selectedValue={collaboration.promotionSubject}
                        onSelect={(value) => {
                            setCollaboration({
                                ...collaboration,
                                promotionSubject: value as Collaboration["promotionSubject"],
                            });
                        }}
                        theme={theme}
                    />
                </ContentWrapper>
                {collaboration.promotionSubject && (
                    <View style={styles.productSection}>
                        <TextInput
                            label="About Product"
                            mode="outlined"
                            placeholder="Eg. TShirt for Kids"
                            multiline
                            numberOfLines={2}
                            value={
                                (collaboration.products ?? [])[0]?.name || ""
                            }
                            onChangeText={(text) => {
                                const current =
                                    (collaboration.products ?? [])[0] ?? {};
                                setCollaboration({
                                    ...collaboration,
                                    products: [
                                        { ...current, name: text || undefined },
                                    ],
                                });
                            }}
                        />
                        <TextInput
                            label="Product Cost (Optional)"
                            mode="outlined"
                            placeholder="Approx Retail Cost of Product"
                            keyboardType="number-pad"
                            value={
                                (collaboration.products ?? [])[0]?.cost !==
                                undefined
                                    ? String(
                                          (collaboration.products ?? [])[0]
                                              ?.cost ?? ""
                                      )
                                    : ""
                            }
                            onChangeText={(text) => {
                                const value = Number(text);
                                const current =
                                    (collaboration.products ?? [])[0] ?? {};
                                setCollaboration({
                                    ...collaboration,
                                    products: [
                                        {
                                            ...current,
                                            cost: isNaN(value)
                                                ? undefined
                                                : value,
                                        },
                                    ],
                                });
                            }}
                        />
                            <Text style={styles.productCostHint}>
                            This cost would be incurred by the brand and not
                            influencers
                        </Text>
                    </View>
                )}
                <ContentWrapper
                    theme={theme}
                    title="Collaboration Fulfillment Type"
                    titleStyle={styles.sectionTitle}
                >
                    <Selector
                        options={[
                            {
                                icon: faBox,
                                label: "Product/Service Will Be Shipped to Influencer",
                                value: CollaborationLocationType.PhysicalMode,
                                description: "Brand will courier the product or perform the service to the influencer's address.",
                            },
                            {
                                icon: faHouseLaptop,
                                label: "Digital / Remote Collaboration",
                                value: CollaborationLocationType.Remote,
                                description: "No physical product. Examples: SaaS tools, apps, online services, digital access.",
                            },
                            {
                                icon: faMapLocationDot,
                                label: "Influencer Visits Store / Location",
                                value: CollaborationLocationType.OnSite,
                                description: "Influencer needs to visit a physical shop, cafe, salon, or venue.",
                            },
                        ]}
                        onSelect={(value) => {
                            if (
                                value === CollaborationLocationType.Remote ||
                                value === CollaborationLocationType.OnSite ||
                                value === CollaborationLocationType.PhysicalMode
                            ) {
                                if (value === CollaborationLocationType.OnSite) {
                                    handleLocationSelect(value);
                                } else {
                                    setCollaboration({
                                        ...collaboration,
                                        location: {
                                            ...collaboration.location,
                                            type: value,
                                        },
                                    });
                                }
                            }
                        }}
                        selectedValue={
                            collaboration.location?.type ||
                            CollaborationLocationType.Remote
                        }
                        theme={theme}
                    />
                </ContentWrapper>
                {collaboration.location?.type === CollaborationLocationType.OnSite && (
                    <View style={styles.locationSection}>
                        {collaboration.location?.type ===
                            CollaborationLocationType.OnSite && (
                            <>
                                <AddressAutocomplete
                                    collaboration={collaboration}
                                    mapRegion={mapRegion}
                                    setCollaboration={setCollaboration}
                                />
                                <CreateCollaborationMap
                                    mapRegion={mapRegion.state}
                                    onLocationChange={onLocationChange}
                                />
                            </>
                        )}
                    </View>
                )}

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

const createStyles = (theme: ReturnType<typeof useTheme>) => {
    const colors = Colors(theme);
    return StyleSheet.create({
        sectionTitle: { fontSize: 16 },
        textInputFullWidth: { width: "100%" },
        productSection: { gap: 12, marginTop: 12 },
        productCostHint: {
            fontSize: 12,
            color: colors.gray300 || "#6B7280",
            marginTop: -6,
        },
        locationSection: { gap: 16 },
    });
};

export default ScreenTwo;
