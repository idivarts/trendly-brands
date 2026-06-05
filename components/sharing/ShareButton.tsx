import ShareModal from "@/components/sharing/ShareModal";
import { ShareTarget } from "@/hooks/use-share-link";
import Colors from "@/shared-uis/constants/Colors";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ShareButtonProps {
    target: ShareTarget;
    /** Display name shown inside the share modal. */
    title: string;
    /**
     * Whether the current member may manage sharing for this resource. When
     * false the button is hidden entirely (public viewers / read-only roles).
     */
    canShare: boolean;
    /** Show a "Share" text label next to the icon (desktop toolbars). */
    showLabel?: boolean;
}

/**
 * Self-contained share affordance: an icon button that opens the ShareModal.
 * Drop it into any toolbar/header; it owns its own modal visibility state.
 */
const ShareButton: React.FC<ShareButtonProps> = ({
    target,
    title,
    canShare,
    showLabel = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [open, setOpen] = useState(false);

    if (!canShare) return null;

    return (
        <View>
            <Pressable
                style={({ pressed }) => [
                    showLabel ? styles.labelledBtn : styles.iconBtn,
                    pressed && styles.pressed,
                ]}
                onPress={() => setOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Share"
            >
                <FontAwesomeIcon icon={faShareNodes} size={14} color={colors.primary} />
                {showLabel && <Text style={styles.labelText}>Share</Text>}
            </Pressable>

            <ShareModal
                visible={open}
                target={target}
                title={title}
                onClose={() => setOpen(false)}
            />
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        iconBtn: {
            width: 38,
            height: 38,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        labelledBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            height: 38,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        labelText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        pressed: {
            opacity: 0.7,
        },
    });
}

export default ShareButton;
