/**
 * PlatformOptionsSection — the labelled "{Platform} options" card that renders a
 * platform's registry-driven fields (text / select / toggle / tags) plus the
 * Twitter thread composer.
 *
 * Shared by two callers:
 *  • VariationEditor — bound to a variation's `platformOptions`.
 *  • The content editor's single-platform case — bound to the generic content's
 *    `platformOptions` (no variation/tab when a content targets one platform).
 */
import PlatformOptionField from "@/components/contents/detail/platform-fields/PlatformOptionField";
import ThreadEditor from "@/components/contents/detail/platform-fields/ThreadEditor";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import { variationSpecForPlatform } from "@/shared-libs/firestore/trendly-pro/constants/platform-fields";
import { IPlatformOptions } from "@/shared-libs/firestore/trendly-pro/models/contents";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
    platform: Platform;
    options: IPlatformOptions;
    onChange: (patch: Partial<IPlatformOptions>) => void;
    /** Caption used as the source for the Twitter "Auto-split" thread action. */
    sourceCaption: string;
    disabled?: boolean;
}

const PlatformOptionsSection: React.FC<Props> = ({ platform, options, onChange, sourceCaption, disabled }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const spec = variationSpecForPlatform(platform);
    if (!spec || spec.fields.length === 0) return null;
    const meta = SOCIAL_PLATFORM_MAP[platform];

    return (
        <View>
            <Text style={styles.label}>{(meta?.label ?? platform).toUpperCase()} OPTIONS</Text>
            <View style={styles.card}>
                {spec.fields.map((field) =>
                    field.type === "thread" ? (
                        <ThreadEditor
                            key={field.key}
                            thread={(options.twitterThread as string[]) ?? []}
                            sourceCaption={sourceCaption}
                            disabled={disabled}
                            onChange={(thread) => onChange({ twitterThread: thread })}
                        />
                    ) : (
                        <PlatformOptionField
                            key={field.key}
                            field={field}
                            options={options}
                            disabled={disabled}
                            onChange={onChange}
                        />
                    )
                )}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        label: {
            fontSize: 12,
            fontWeight: "800",
            color: colors.textSecondary,
            letterSpacing: 0.5,
            marginBottom: 8,
        },
        card: {
            backgroundColor: colors.aliceBlue,
            borderRadius: 12,
            padding: 14,
            gap: 16,
        },
    });
}

export default PlatformOptionsSection;
