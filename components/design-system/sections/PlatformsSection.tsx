import {
    ALL_PLATFORMS,
    Platform,
} from "@/shared-libs/firestore/trendly-pro/constants/platform";
import { IDSPlatformOverride } from "@/shared-libs/firestore/trendly-pro/models/design-system";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text as PaperText } from "react-native-paper";
import {
    ChipInput,
    DSTextInput,
    FieldLabel,
    FieldStack,
    OptionSelect,
    SectionIntro,
} from "../fields";
import { SectionProps } from "../section-props";

function platformLabel(p: Platform): string {
    return p
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

const PlatformsSection: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const overrides = ds.platformOverrides ?? {};
    const [selected, setSelected] = useState<Platform>(ALL_PLATFORMS[0]);

    const current = overrides[selected] ?? {};
    const set = (patch: Partial<IDSPlatformOverride>) =>
        onPatch({
            platformOverrides: { ...overrides, [selected]: { ...current, ...patch } },
        });

    const hasOverride = (p: Platform) => {
        const ov = overrides[p];
        if (!ov) return false;
        return Object.values(ov).some(
            (v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
        );
    };

    return (
        <View>
            <SectionIntro
                title="Platform overrides"
                subtitle="Everything above is the shared standard. Here you can tweak tone, length and hashtags per network — only the differences, applied when the AI writes for that platform."
            />

            <View style={styles.platformRow}>
                {ALL_PLATFORMS.map((p) => {
                    const active = selected === p;
                    return (
                        <Pressable
                            key={p}
                            onPress={() => setSelected(p)}
                            style={[styles.platformPill, active && styles.platformPillActive]}
                        >
                            {hasOverride(p) && <View style={styles.dot} />}
                            <View>
                                <PaperText
                                    style={[
                                        styles.platformPillText,
                                        active && styles.platformPillTextActive,
                                    ]}
                                >
                                    {platformLabel(p)}
                                </PaperText>
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.editor}>
                <FieldStack>
                    <View>
                        <FieldLabel>Tone override</FieldLabel>
                        <DSTextInput
                            value={current.toneOverride}
                            onChangeText={(toneOverride) => set({ toneOverride })}
                            placeholder={`e.g. More professional on ${platformLabel(selected)}`}
                        />
                    </View>

                    <OptionSelect
                        label="Caption length"
                        options={[
                            { value: "short", label: "Short" },
                            { value: "medium", label: "Medium" },
                            { value: "long", label: "Long" },
                        ]}
                        value={current.captionLength}
                        onChange={(captionLength) =>
                            set({ captionLength: captionLength as IDSPlatformOverride["captionLength"] })
                        }
                    />

                    <View>
                        <FieldLabel>Hashtag strategy</FieldLabel>
                        <DSTextInput
                            value={current.hashtagStrategy}
                            onChangeText={(hashtagStrategy) => set({ hashtagStrategy })}
                            placeholder="e.g. 3–5 niche tags, no generic ones"
                        />
                    </View>

                    <ChipInput
                        label="Content pillars"
                        hint="Themes to lean into on this platform."
                        values={current.contentPillars}
                        onChange={(contentPillars) => set({ contentPillars })}
                        placeholder="e.g. education"
                    />

                    <View>
                        <FieldLabel>Notes</FieldLabel>
                        <DSTextInput
                            value={current.notes}
                            onChangeText={(notes) => set({ notes })}
                            placeholder="Anything else specific to this platform."
                            multiline
                            numberOfLines={2}
                        />
                    </View>
                </FieldStack>
            </View>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        platformRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 18,
        },
        platformPill: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: colors.tag,
        },
        platformPillActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        platformPillText: {
            color: colors.text,
            fontSize: 13,
            fontWeight: "600",
        },
        platformPillTextActive: {
            color: colors.onPrimary,
        },
        dot: {
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: colors.success,
        },
        editor: {
            marginTop: 2,
        },
    });
}

export default PlatformsSection;
