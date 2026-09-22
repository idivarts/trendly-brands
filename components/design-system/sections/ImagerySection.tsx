import { IDSImagery } from "@/shared-libs/firestore/trendly-pro/models/design-system";
import React from "react";
import { View } from "react-native";
import {
    ChipInput,
    DSTextInput,
    FieldLabel,
    FieldStack,
    OptionSelect,
    SectionIntro,
} from "../fields";
import { SectionProps } from "../section-props";

const ImagerySection: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const imagery = ds.imagery ?? {};
    const set = (patch: Partial<IDSImagery>) => onPatch({ imagery: { ...imagery, ...patch } });

    return (
        <View>
            <SectionIntro
                title="Imagery & photography style"
                subtitle="The look of the brand's visuals. This directly steers every image the AI generates."
            />

            <FieldStack>
                <ChipInput
                    label="Mood keywords"
                    hint="The single most important input for on-brand images."
                    values={imagery.moodKeywords}
                    onChange={(moodKeywords) => set({ moodKeywords })}
                    placeholder="e.g. bright, minimal, airy"
                />

                <OptionSelect
                    label="Style"
                    options={[
                        { value: "photo", label: "Photo" },
                        { value: "illustration", label: "Illustration" },
                        { value: "3d", label: "3D" },
                        { value: "mixed", label: "Mixed" },
                    ]}
                    value={imagery.styleType}
                    onChange={(styleType) =>
                        set({ styleType: styleType as IDSImagery["styleType"] })
                    }
                />

                <View>
                    <FieldLabel>Color treatment</FieldLabel>
                    <DSTextInput
                        value={imagery.colorTreatment}
                        onChangeText={(colorTreatment) => set({ colorTreatment })}
                        placeholder="e.g. warm, soft-contrast, pastel"
                    />
                </View>

                <View>
                    <FieldLabel>Composition</FieldLabel>
                    <DSTextInput
                        value={imagery.composition}
                        onChangeText={(composition) => set({ composition })}
                        placeholder="e.g. lots of negative space, product centered"
                    />
                </View>

                <View>
                    <FieldLabel>Subject matter</FieldLabel>
                    <DSTextInput
                        value={imagery.subjectMatter}
                        onChangeText={(subjectMatter) => set({ subjectMatter })}
                        placeholder="e.g. real people, close-up textures, everyday moments"
                    />
                </View>

                <ChipInput
                    label="Avoid in visuals"
                    hint="Used as negative prompts — the AI keeps these out."
                    values={imagery.avoid}
                    onChange={(avoid) => set({ avoid })}
                    placeholder="e.g. stock-photo look, harsh flash"
                />
            </FieldStack>
        </View>
    );
};

export default ImagerySection;
