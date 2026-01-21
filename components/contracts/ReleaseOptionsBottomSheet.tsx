import { Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

export type ReleasePlanType = "influencer_post_independently" | "collab_post" | "brand_post_independently";

export interface ReleasePlan {
    type: ReleasePlanType;
    boostOnTrendly?: boolean;
}

interface ReleaseOptionsBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (plan: ReleasePlan) => Promise<void> | void;
}

const Card: React.FC<{ title: string; description: string; selected: boolean; onPress: () => void; }> = ({ title, description, selected, onPress }) => {
    const theme = useTheme();
    return (
        <Pressable
            onPress={onPress}
            style={[styles.optionCard, { borderColor: selected ? Colors(theme).primary : Colors(theme).gray300 }]}
        >
            <Text style={[styles.cardTitle, { color: Colors(theme).text }]}>{title}</Text>
            <Text style={[styles.cardDesc, { color: Colors(theme).gray300 }]}>{description}</Text>
        </Pressable>
    );
};

const ReleaseOptionsBottomSheet: React.FC<ReleaseOptionsBottomSheetProps> = ({ visible, onClose, onSelect }) => {
    const theme = useTheme();
    const [selected, setSelected] = useState<ReleasePlanType | null>(null);
    const [boost, setBoost] = useState(false);

    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["75%"], []);

    useEffect(() => {
        console.log("🔵 ReleaseOptionsBottomSheet visible prop changed to:", visible);
        console.log("🔵 sheetRef.current:", sheetRef.current);
        if (visible) {
            console.log("🔵 Attempting to present bottom sheet...");
            // Use setTimeout to ensure BottomSheetModalProvider is fully ready
            setTimeout(() => {
                console.log("🔵 Executing present() now...");
                try {
                    sheetRef.current?.present();
                    console.log("✅ Present() executed successfully");
                } catch (error) {
                    console.error("❌ Error calling present():", error);
                }
            }, 100);
        } else {
            console.log("🔵 Attempting to dismiss bottom sheet...");
            sheetRef.current?.dismiss();
        }
    }, [visible]);

    const handleConfirm = async () => {
        if (!selected) return;
        await onSelect({ type: selected, boostOnTrendly: boost });
        sheetRef.current?.dismiss();
    };

    const handleCardPress = async (type: ReleasePlanType) => {
        setSelected(type);
        await onSelect({ type, boostOnTrendly: boost });
        sheetRef.current?.dismiss();
    };

    const renderBackdrop = (props: any) => (
        <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
        />
    );

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            onDismiss={onClose}
            enablePanDownToClose
            enableDynamicSizing={false}
            index={0}
            backgroundStyle={{ backgroundColor: Colors(theme).background }}
            handleIndicatorStyle={{ backgroundColor: Colors(theme).text }}
        >
            <View style={styles.sheet}>
                <View style={styles.dragBar} />

                <Card
                    title="Influencer will Post independently"
                    description="Brand will courier the product to the influencer’s address."
                    selected={selected === "influencer_post_independently"}
                    onPress={() => handleCardPress("influencer_post_independently")}
                />

                <Card
                    title="Influencer needs to Collab Post"
                    description="No physical product. Examples: SaaS tools, apps, online services, digital access."
                    selected={selected === "collab_post"}
                    onPress={() => handleCardPress("collab_post")}
                />

                <Card
                    title="Brand will post Independently"
                    description="Influencer needs to visit a physical shop, cafe, salon, or venue."
                    selected={selected === "brand_post_independently"}
                    onPress={() => handleCardPress("brand_post_independently")}
                />

                <Pressable onPress={() => setBoost(!boost)} style={styles.checkboxRow}>
                    <View
                        style={[
                            styles.checkbox,
                            {
                                borderColor: Colors(theme).text,
                                backgroundColor: boost ? Colors(theme).text : "transparent",
                            },
                        ]}
                    />
                    <Text style={{ color: Colors(theme).text }}>
                        Boost your post by automatically shared on Trendly’s insta account (for free)
                    </Text>
                </Pressable>

                <View style={styles.actions}>
                    <Button mode="outlined" onPress={() => sheetRef.current?.dismiss()}>
                        Cancel
                    </Button>
                    <Button mode="contained" onPress={handleConfirm} disabled={!selected}>
                        Continue
                    </Button>
                </View>
            </View>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        gap: 12,
    },
    dragBar: {
        alignSelf: "center",
        width: 60,
        height: 6,
        backgroundColor: "#DDD",
        borderRadius: 3,
        marginBottom: 8,
    },
    optionCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        gap: 6,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    cardDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
});

export default ReleaseOptionsBottomSheet;