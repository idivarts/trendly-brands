import {
    IDSContentRules,
    IDSHashtagRules,
} from "@/shared-libs/firestore/trendly-pro/models/design-system";
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

const RulesSection: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const rules = ds.rules ?? {};
    const set = (patch: Partial<IDSContentRules>) => onPatch({ rules: { ...rules, ...patch } });
    const setHashtag = (patch: Partial<IDSHashtagRules>) =>
        set({ hashtag: { ...(rules.hashtag ?? {}), ...patch } });

    const maxCountText =
        typeof rules.hashtag?.maxCount === "number" ? String(rules.hashtag.maxCount) : "";

    return (
        <View>
            <SectionIntro
                title="Content rules & guardrails"
                subtitle="The hard rules the AI must respect on every caption and script — banned words never appear, disclaimers always do."
            />

            <FieldStack>
                <ChipInput
                    label="Banned words"
                    hint="The AI will never use these."
                    values={rules.bannedWords}
                    onChange={(bannedWords) => set({ bannedWords })}
                    placeholder="e.g. cheap, guaranteed"
                />

                <ChipInput
                    label="Preferred terms"
                    hint="Wording the brand prefers."
                    values={rules.preferredTerms}
                    onChange={(preferredTerms) => set({ preferredTerms })}
                    placeholder="e.g. members (not customers)"
                />

                <ChipInput
                    label="Approved claims"
                    hint="Only claims you're cleared to make."
                    values={rules.approvedClaims}
                    onChange={(approvedClaims) => set({ approvedClaims })}
                    placeholder="e.g. clinically tested"
                />

                <ChipInput
                    label="Required disclaimers"
                    hint="Always included where relevant."
                    values={rules.disclaimers}
                    onChange={(disclaimers) => set({ disclaimers })}
                    placeholder="e.g. Results may vary."
                />

                <ChipInput
                    label="Required mentions"
                    hint="Handles/tags to always include."
                    values={rules.requiredMentions}
                    onChange={(requiredMentions) => set({ requiredMentions })}
                    placeholder="e.g. @trendly"
                />

                <ChipInput
                    label="Branded hashtags"
                    values={rules.hashtag?.branded}
                    onChange={(branded) => setHashtag({ branded })}
                    placeholder="e.g. #trendlylife"
                />

                <ChipInput
                    label="Banned hashtags"
                    values={rules.hashtag?.banned}
                    onChange={(banned) => setHashtag({ banned })}
                    placeholder="e.g. #ad"
                />

                <View>
                    <FieldLabel hint="Soft cap the AI aims to stay under.">Max hashtags</FieldLabel>
                    <DSTextInput
                        value={maxCountText}
                        onChangeText={(v) => {
                            const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
                            setHashtag({ maxCount: Number.isFinite(n) ? n : undefined });
                        }}
                        placeholder="e.g. 8"
                        keyboardType="numeric"
                    />
                </View>

                <View>
                    <FieldLabel>Call-to-action style</FieldLabel>
                    <DSTextInput
                        value={rules.ctaStyle}
                        onChangeText={(ctaStyle) => set({ ctaStyle })}
                        placeholder="e.g. Soft, curiosity-driven — 'see why' over 'buy now'"
                    />
                </View>

                <View>
                    <FieldLabel>Grammar & style</FieldLabel>
                    <DSTextInput
                        value={rules.grammar}
                        onChangeText={(grammar) => set({ grammar })}
                        placeholder="e.g. Use the Oxford comma. Sentence case for headlines. No em-dashes."
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <ChipInput
                    label="Do"
                    values={rules.dos}
                    onChange={(dos) => set({ dos })}
                    placeholder="e.g. lead with a benefit"
                />

                <ChipInput
                    label="Don't"
                    values={rules.donts}
                    onChange={(donts) => set({ donts })}
                    placeholder="e.g. use fear-based hooks"
                />
            </FieldStack>
        </View>
    );
};

export default RulesSection;
