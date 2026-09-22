import {
    DS_TONE_DIALS,
    IDSToneSliders,
    IDSVoice,
} from "@/shared-libs/firestore/trendly-pro/models/design-system";
import React from "react";
import { View } from "react-native";
import {
    ChipInput,
    DSTextInput,
    FieldLabel,
    FieldStack,
    InlineHelp,
    OptionSelect,
    SectionIntro,
    ToneDial,
} from "../fields";
import { SectionProps } from "../section-props";

const VoiceSection: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const voice = ds.voice ?? {};
    const set = (patch: Partial<IDSVoice>) => onPatch({ voice: { ...voice, ...patch } });
    const setTone = (patch: Partial<IDSToneSliders>) =>
        set({ tone: { ...(voice.tone ?? {}), ...patch } });

    return (
        <View>
            <SectionIntro
                title="Voice & tone"
                subtitle="How the brand sounds. This is the single source of truth the AI writes in — it replaces the older free-text brand voice."
            />

            <FieldStack>
                <ChipInput
                    label="Voice adjectives"
                    hint="A few words that describe the brand's voice."
                    values={voice.adjectives}
                    onChange={(adjectives) => set({ adjectives })}
                    placeholder="e.g. warm, witty, confident"
                />

                <View>
                    <FieldLabel hint="Tap a dot to set each dial; tap it again to clear.">
                        Tone
                    </FieldLabel>
                    {DS_TONE_DIALS.map((dial) => (
                        <ToneDial
                            key={dial.key}
                            low={dial.low}
                            high={dial.high}
                            value={voice.tone?.[dial.key]}
                            onChange={(v) => setTone({ [dial.key]: v })}
                        />
                    ))}
                </View>

                <OptionSelect
                    label="Point of view"
                    options={[
                        { value: "we", label: "We" },
                        { value: "you", label: "You" },
                        { value: "brand", label: "Brand name" },
                    ]}
                    value={voice.pov}
                    onChange={(pov) => set({ pov: pov as IDSVoice["pov"] })}
                />

                <OptionSelect
                    label="Emoji"
                    options={[
                        { value: "none", label: "None" },
                        { value: "minimal", label: "Minimal" },
                        { value: "liberal", label: "Liberal" },
                    ]}
                    value={voice.emojiPolicy}
                    onChange={(emojiPolicy) =>
                        set({ emojiPolicy: emojiPolicy as IDSVoice["emojiPolicy"] })
                    }
                />

                <OptionSelect
                    label="Reading level"
                    options={[
                        { value: "simple", label: "Simple" },
                        { value: "general", label: "General" },
                        { value: "advanced", label: "Advanced" },
                    ]}
                    value={voice.readingLevel}
                    onChange={(readingLevel) => set({ readingLevel })}
                />

                <ChipInput
                    label="Sample phrases"
                    hint="Lines that sound exactly like the brand."
                    values={voice.samplePhrases}
                    onChange={(samplePhrases) => set({ samplePhrases })}
                    placeholder="e.g. Your skin, your rules."
                />

                <View>
                    <FieldLabel>Voice notes</FieldLabel>
                    <DSTextInput
                        value={voice.guidelines}
                        onChangeText={(guidelines) => set({ guidelines })}
                        placeholder="Anything the dials can't capture — e.g. 'Never salesy. Lead with empathy. Short sentences.'"
                        multiline
                        numberOfLines={4}
                    />
                    <InlineHelp>This replaces the brand's old AI voice field.</InlineHelp>
                </View>
            </FieldStack>
        </View>
    );
};

export default VoiceSection;
