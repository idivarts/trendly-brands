import {
    DS_COLOR_ROLES,
    IDSColor,
} from "@/shared-libs/firestore/trendly-pro/models/design-system";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
    AddRowButton,
    DSTextInput,
    HexSwatch,
    OptionSelect,
    RemovableRow,
    SectionIntro,
} from "../fields";
import { SectionProps } from "../section-props";

const ColorsSection: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const styles = useMemo(() => createStyles(), []);

    const palette = ds.palette ?? [];
    const setPalette = (next: IDSColor[]) => onPatch({ palette: next });
    const updateAt = (i: number, patch: Partial<IDSColor>) =>
        setPalette(palette.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
    const removeAt = (i: number) => setPalette(palette.filter((_, idx) => idx !== i));
    const add = () => setPalette([...palette, { hex: "#", role: "primary" }]);

    return (
        <View>
            <SectionIntro
                title="Colors"
                subtitle="The brand palette, grouped by role. These become the colors the AI uses in every generated design and image."
            />

            <View style={styles.list}>
                {palette.map((color, i) => (
                    <RemovableRow key={i} onRemove={() => removeAt(i)}>
                        <View style={styles.cardBody}>
                            <View style={styles.topRow}>
                                <HexSwatch hex={color.hex} size={44} />
                                <View style={styles.hexInput}>
                                    <DSTextInput
                                        label="Hex"
                                        value={color.hex}
                                        onChangeText={(hex) => updateAt(i, { hex })}
                                        placeholder="#054463"
                                        autoCapitalize="none"
                                        maxLength={7}
                                    />
                                </View>
                            </View>

                            <DSTextInput
                                label="Name (optional)"
                                value={color.name}
                                onChangeText={(name) => updateAt(i, { name })}
                                placeholder="e.g. Brand navy"
                            />

                            <OptionSelect
                                label="Role"
                                options={DS_COLOR_ROLES.map((r) => ({ value: r, label: r }))}
                                value={color.role}
                                clearable={false}
                                onChange={(role) => updateAt(i, { role: role as IDSColor["role"] })}
                            />
                        </View>
                    </RemovableRow>
                ))}
            </View>

            <AddRowButton label="Add color" onPress={add} />
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
        topRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        hexInput: {
            flex: 1,
        },
    });
}

export default ColorsSection;
