import { useTheme } from "@react-navigation/native";
import { Pressable, View } from "react-native";
import { Divider, Text as PaperText, Surface, Button } from "react-native-paper";

import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";

const AGE_OPTIONS = [
    { key: "JUST_STARTING", title: "Just starting", desc: "New or pre-launch brand" },
    { key: "LT_1", title: "Less than 1 year", desc: "Operating for under 12 months" },
    { key: "LT_5", title: "Less than 5 years", desc: "Established but growing" },
    { key: "GT_5", title: "5+ years", desc: "Well established brand" },
];

interface BrandAgeProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    onNext?: () => void;
}

const BrandAge: React.FC<BrandAgeProps> = ({ brandData, setBrandData, onNext }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const brandAge = brandData.age;

    return (
        <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card }} elevation={1}>
            <PaperText variant="titleMedium" style={{ fontWeight: "800", color: colors.text }}>
                Brand age
            </PaperText>
            <PaperText style={{ color: colors.textSecondary, marginTop: 4 }}>
                How established is your brand? (required)
            </PaperText>
            <Divider style={{ marginTop: 12, marginBottom: 16, backgroundColor: colors.surface }} />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {AGE_OPTIONS.map((opt) => {
                    const selected = brandAge === opt.key;
                    return (
                        <Pressable
                            key={opt.key}
                            onPress={() =>
                                setBrandData({
                                    ...brandData,
                                    profile: { ...brandData.profile },
                                    age: opt.key as any,
                                })
                            }
                            style={{
                                flexBasis: "48%",
                                marginBottom: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: selected ? colors.primary : colors.border,
                                backgroundColor: selected ? colors.primaryLight : colors.background,
                                padding: 16,
                            }}
                        >
                            <PaperText style={{ fontWeight: "800", fontSize: 15, color: selected ? colors.primary : colors.text }}>
                                {opt.title}
                            </PaperText>
                            <PaperText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                                {opt.desc}
                            </PaperText>
                        </Pressable>
                    );
                })}
            </View>

            {onNext && (
                <View style={{ marginTop: 16 }}>
                    <Button
                        mode="contained"
                        onPress={onNext}
                        style={{ borderRadius: 12 }}
                        buttonColor={colors.primary}
                    >
                        Next
                    </Button>
                </View>
            )}
        </Surface>
    );
};

export default BrandAge;
