import Colors from "@/constants/Colors";
import {
    INITIAL_PLATFORMS,
    PLATFORMS,
} from "@/constants/ItemsList";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import { Selector } from "@/shared-uis/components/select/selector";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
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
import { Alert, Text, useWindowDimensions } from "react-native";
import AddressAutocomplete from "../collaboration/create-collaboration/AddressAutocomplete";
import CreateCollaborationMap from "../collaboration/create-collaboration/CreateCollaborationMap";
import { View } from "../theme/Themed";
import Button from "../ui/button";
import TextInput from "../ui/text-input";
import ScreenLayout from "./screen-layout";

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
            collaboration.numberOfInfluencersNeeded &&
            collaboration.numberOfInfluencersNeeded >= 11
        ) {
            return ">10";
        }

        return `${collaboration.numberOfInfluencersNeeded || 1}`;
    }, [collaboration.numberOfInfluencersNeeded]);

    const handleLocationSelect = async (
        value: "remote" | "on_site" | "physical_mode"
    ) => {
        if (value === "on_site") {
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
                        style={{
                            width: "100%",
                        }}
                    />
                </ContentWrapper>
                <ContentWrapper
                    theme={theme}
                    title="What are you promoting?"
                    titleStyle={{ fontSize: 16 }}
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
                        variant="vertical"
                        theme={theme}
                    />
                </ContentWrapper>
                {collaboration.promotionSubject && (
                    <View
                        style={{
                            gap: 12,
                            marginTop: 12,
                        }}
                    >
                        <TextInput
                            label="About Product"
                            mode="outlined"
                            placeholder="Eg. TShirt for Kids"
                            multiline
                            numberOfLines={2}
                            value={(collaboration as any).productDetails?.name || ""}
                            onChangeText={(text) => {
                                setCollaboration({
                                    ...(collaboration as any),
                                    productDetails: {
                                        ...((collaboration as any).productDetails),
                                        name: text,
                                    },
                                });
                            }}
                        />

                        {collaboration.promotionSubject === "physical_product" && (
                            <>
                                <TextInput
                                    label="Product Cost (Optional)"
                                    mode="outlined"
                                    placeholder="Approx Retail Cost of Product"
                                    keyboardType="number-pad"
                                    value={
                                        (collaboration as any).productDetails?.cost !== undefined
                                            ? (collaboration as any).productDetails.cost.toString()
                                            : ""
                                    }
                                    onChangeText={(text) => {
                                        const value = Number(text);
                                        setCollaboration({
                                            ...(collaboration as any),
                                            productDetails: {
                                                ...((collaboration as any).productDetails),
                                                cost: isNaN(value) ? undefined : value,
                                            },
                                        });
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: "#6B7280",
                                        marginTop: -6,
                                    }}
                                >
                                    This cost would be incurred by the brand and not influencers
                                </Text>
                            </>
                        )}
                    </View>
                )}
                <ContentWrapper
                    theme={theme}
                    title="Collaboration Fulfillment Type"
                    titleStyle={{
                        fontSize: 16,
                    }}
                >
                    <Selector
                        options={[
                            {
                                icon: faBox,
                                label: "Product/Service Will Be Shipped to Influencer",
                                value: "physical_mode",
                                description: "Brand will courier the product or perform the service to the influencer's address.",
                            },
                            {
                                icon: faHouseLaptop,
                                label: "Digital / Remote Collaboration",
                                value: "remote",
                                description: "No physical product. Examples: SaaS tools, apps, online services, digital access.",
                            },
                            {
                                icon: faMapLocationDot,
                                label: "Influencer Visits Store / Location",
                                value: "on_site",
                                description: "Influencer needs to visit a physical shop, cafe, salon, or venue.",
                            },
                        ]}
                        onSelect={(value) => {
                            if (value === "remote" || value === "on_site" || value === "physical_mode") {
                                if (value === "on_site") {
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
                        selectedValue={collaboration.location?.type || "remote"}
                        variant="vertical"
                        theme={theme}
                    />
                </ContentWrapper>

                {/* ===== PHYSICAL MODE: Product/Service Will Be Shipped to Influencer ===== */}
                {collaboration.location?.type === "physical_mode" && (
                    <View
                        style={{
                            gap: 16,
                        }}
                    >
                        {/* Physical Mode UI will be added here */}
                    </View>
                )}

                {/* ===== REMOTE MODE: Digital / Remote Collaboration ===== */}
                {collaboration.location?.type === "remote" && (
                    <View
                        style={{
                            gap: 16,
                        }}
                    >
                        {/* Remote Mode UI will be added here */}
                    </View>
                )}

                {/* ===== ON-SITE MODE: Influencer Visits Store / Location ===== */}
                {collaboration.location?.type === "on_site" && (
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

export default ScreenTwo;
