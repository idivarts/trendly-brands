import { IDSIdentity } from "@/shared-libs/firestore/trendly-pro/models/design-system";
import React from "react";
import { View } from "react-native";
import {
    ChipInput,
    DSTextInput,
    FieldLabel,
    FieldStack,
    SectionIntro,
} from "../fields";
import { SectionProps } from "../section-props";

const IdentitySection: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const id = ds.identity ?? {};
    const set = (patch: Partial<IDSIdentity>) => onPatch({ identity: { ...id, ...patch } });

    return (
        <View>
            <SectionIntro
                title="Identity & positioning"
                subtitle="Who the brand is and who it talks to. The AI uses this to keep every caption and idea on-message."
            />

            <FieldStack>
                <View>
                    <FieldLabel hint="A short line that captures the brand.">Tagline</FieldLabel>
                    <DSTextInput
                        value={id.tagline}
                        onChangeText={(v) => set({ tagline: v })}
                        placeholder="e.g. Skincare that actually listens"
                    />
                </View>

                <View>
                    <FieldLabel hint="One or two sentences on what the brand stands for.">
                        Mission / one-liner
                    </FieldLabel>
                    <DSTextInput
                        value={id.mission}
                        onChangeText={(v) => set({ mission: v })}
                        placeholder="e.g. We make clean, effective skincare accessible to Gen-Z."
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View>
                    <FieldLabel hint="Who the content is for — describe the person.">
                        Target audience
                    </FieldLabel>
                    <DSTextInput
                        value={id.audience}
                        onChangeText={(v) => set({ audience: v })}
                        placeholder="e.g. 18–26, urban, budget-conscious, cares about ingredients and sustainability"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <ChipInput
                    label="Brand personality"
                    hint="Adjectives / an archetype. Type and press enter."
                    values={id.personality}
                    onChange={(personality) => set({ personality })}
                    placeholder="e.g. playful, honest, warm"
                />

                <ChipInput
                    label="Value propositions"
                    hint="The concrete reasons to choose this brand."
                    values={id.valueProps}
                    onChange={(valueProps) => set({ valueProps })}
                    placeholder="e.g. dermatologist-tested"
                />

                <ChipInput
                    label="Competitors"
                    hint="For contrast — never mentioned in content."
                    values={id.competitors}
                    onChange={(competitors) => set({ competitors })}
                    placeholder="e.g. The Ordinary"
                />
            </FieldStack>
        </View>
    );
};

export default IdentitySection;
