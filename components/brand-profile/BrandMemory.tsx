import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Divider, HelperText, Text as PaperText, TextInput as PaperTextInput, Surface } from "react-native-paper";

// Mirrors the backend maxBrandMemoryChars cap (memory_tools.go). A UI affordance
// only — the backend stays the source of truth and compacts beyond this.
const MAX_MEMORY_CHARS = 4000;

interface BrandMemoryProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    onBack?: () => void;
    plainSection?: boolean;
    compactLayout?: boolean;
}

const BrandMemory: React.FC<BrandMemoryProps> = ({
    brandData,
    setBrandData,
    onBack,
    plainSection = false,
    compactLayout = false,
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors, compactLayout), [colors, compactLayout]);

    return plainSection ? (
        <View style={styles.wrapperPlain}>
            <View style={styles.headerRow}>
                {onBack && (
                    <Pressable onPress={onBack} style={styles.backBtn}>
                        <PaperText style={styles.backArrow}>←</PaperText>
                    </Pressable>
                )}
                <PaperText variant="titleMedium" style={styles.sectionTitle}>
                    AI Memory
                </PaperText>
            </View>
            <PaperText style={styles.subtitle}>
                Durable facts the AI reads at the start of every chat. It updates this automatically as you talk — edit or trim it here anytime.
            </PaperText>
            <Divider style={styles.divider} />

            <PaperTextInput
                mode="outlined"
                label="Brand memory"
                multiline
                numberOfLines={compactLayout ? 6 : 8}
                maxLength={MAX_MEMORY_CHARS}
                placeholder="e.g. We're a sustainable skincare brand for Gen-Z. Voice is playful but never salesy. Never mention competitors by name."
                value={brandData.aiMemory ?? ""}
                onChangeText={(value) =>
                    setBrandData({
                        ...brandData,
                        aiMemory: value,
                    })
                }
                outlineStyle={styles.inputOutline}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.input}
            />
            <View style={styles.helperRow}>
                <HelperText type="info" style={styles.helper}>
                    Shared across all of this brand's chats — never with other brands.
                </HelperText>
                <PaperText style={styles.counter}>
                    {(brandData.aiMemory?.length ?? 0)}/{MAX_MEMORY_CHARS}
                </PaperText>
            </View>
        </View>
    ) : (
        <Surface style={styles.wrapperCard} elevation={1}>
            <View style={styles.headerRow}>
                {onBack && (
                    <Pressable onPress={onBack} style={styles.backBtn}>
                        <PaperText style={styles.backArrow}>←</PaperText>
                    </Pressable>
                )}
                <PaperText variant="titleMedium" style={styles.sectionTitle}>
                    AI Memory
                </PaperText>
            </View>
            <PaperText style={styles.subtitle}>
                Durable facts the AI reads at the start of every chat. It updates this automatically as you talk — edit or trim it here anytime.
            </PaperText>
            <Divider style={styles.divider} />

            <PaperTextInput
                mode="outlined"
                label="Brand memory"
                multiline
                numberOfLines={compactLayout ? 6 : 8}
                maxLength={MAX_MEMORY_CHARS}
                placeholder="e.g. We're a sustainable skincare brand for Gen-Z. Voice is playful but never salesy. Never mention competitors by name."
                value={brandData.aiMemory ?? ""}
                onChangeText={(value) =>
                    setBrandData({
                        ...brandData,
                        aiMemory: value,
                    })
                }
                outlineStyle={styles.inputOutline}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.input}
            />
            <View style={styles.helperRow}>
                <HelperText type="info" style={styles.helper}>
                    Shared across all of this brand's chats — never with other brands.
                </HelperText>
                <PaperText style={styles.counter}>
                    {(brandData.aiMemory?.length ?? 0)}/{MAX_MEMORY_CHARS}
                </PaperText>
            </View>
        </Surface>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, compact: boolean) {
    const inputRadius = compact ? 8 : 12;

    return StyleSheet.create({
        wrapperPlain: {
            paddingVertical: compact ? 4 : 8,
        },
        wrapperCard: {
            borderRadius: 16,
            padding: compact ? 12 : 16,
            backgroundColor: colors.card,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: compact ? 4 : 8,
        },
        backBtn: {
            marginRight: 12,
            padding: 4,
        },
        backArrow: {
            fontSize: compact ? 18 : 20,
            color: colors.text,
        },
        sectionTitle: {
            fontWeight: "800",
            color: colors.text,
            fontSize: compact ? 15 : undefined,
        },
        subtitle: {
            color: colors.textSecondary,
            marginTop: 4,
            fontSize: compact ? 13 : undefined,
        },
        divider: {
            marginTop: compact ? 8 : 12,
            marginBottom: compact ? 10 : 16,
            backgroundColor: colors.surface,
        },
        inputOutline: {
            borderRadius: inputRadius,
        },
        input: {
            backgroundColor: colors.background,
        },
        helperRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 2,
        },
        helper: {
            flex: 1,
            color: colors.textSecondary,
            fontSize: compact ? 12 : undefined,
        },
        counter: {
            color: colors.textSecondary,
            fontSize: 12,
            marginTop: 8,
        },
    });
}

export default BrandMemory;
