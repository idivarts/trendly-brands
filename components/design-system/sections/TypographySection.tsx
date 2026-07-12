import {
    DS_FONT_ROLES,
    IDSFont,
} from "@/shared-libs/firestore/trendly-pro/models/design-system";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
    AddRowButton,
    DSTextInput,
    OptionSelect,
    RemovableRow,
    SectionIntro,
} from "../fields";
import { SectionProps } from "../section-props";

const SOURCE_OPTIONS = [
    { value: "google", label: "Google" },
    { value: "adobe", label: "Adobe" },
    { value: "custom", label: "Custom" },
];

const TypographySection: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const styles = useMemo(() => createStyles(), []);

    const fonts = ds.fonts ?? [];
    const setFonts = (next: IDSFont[]) => onPatch({ fonts: next });
    const updateAt = (i: number, patch: Partial<IDSFont>) =>
        setFonts(fonts.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
    const removeAt = (i: number) => setFonts(fonts.filter((_, idx) => idx !== i));
    const add = () => setFonts([...fonts, { role: "heading", source: "google" }]);

    return (
        <View>
            <SectionIntro
                title="Typography"
                subtitle="The brand's typefaces by role. The AI uses these in generated designs; body and heading are the two that matter most."
            />

            <View style={styles.list}>
                {fonts.map((font, i) => (
                    <RemovableRow key={i} onRemove={() => removeAt(i)}>
                        <View style={styles.cardBody}>
                            <OptionSelect
                                label="Role"
                                options={DS_FONT_ROLES.map((r) => ({ value: r, label: r }))}
                                value={font.role}
                                clearable={false}
                                onChange={(role) => updateAt(i, { role: role as IDSFont["role"] })}
                            />

                            <DSTextInput
                                label="Font family"
                                value={font.family}
                                onChangeText={(family) => updateAt(i, { family })}
                                placeholder="e.g. Quicksand"
                            />

                            <OptionSelect
                                label="Source"
                                options={SOURCE_OPTIONS}
                                value={font.source}
                                clearable={false}
                                onChange={(source) =>
                                    updateAt(i, { source: source as IDSFont["source"] })
                                }
                            />

                            <View style={styles.pair}>
                                <View style={styles.pairItem}>
                                    <DSTextInput
                                        label="Weight"
                                        value={font.weight}
                                        onChangeText={(weight) => updateAt(i, { weight })}
                                        placeholder="e.g. 700"
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={styles.pairItem}>
                                    <DSTextInput
                                        label="Fallback"
                                        value={font.fallback}
                                        onChangeText={(fallback) => updateAt(i, { fallback })}
                                        placeholder="e.g. sans-serif"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {font.source !== "google" && (
                                <DSTextInput
                                    label="Font file / URL"
                                    value={font.url}
                                    onChangeText={(url) => updateAt(i, { url })}
                                    placeholder="https://…"
                                    keyboardType="url"
                                    autoCapitalize="none"
                                />
                            )}
                        </View>
                    </RemovableRow>
                ))}
            </View>

            <AddRowButton label="Add font" onPress={add} />
        </View>
    );
};

function createStyles() {
    return StyleSheet.create({
        list: {
            gap: 18,
        },
        cardBody: {
            gap: 12,
        },
        pair: {
            flexDirection: "row",
            gap: 12,
        },
        pairItem: {
            flex: 1,
        },
    });
}

export default TypographySection;
