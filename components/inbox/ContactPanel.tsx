import {
    faLocationDot,
    faUserGroup,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import ChannelAvatar from "./ChannelAvatar";
import ResyncInline from "./ResyncInline";
import { InboxConversation } from "./types";
import { channelLabel, formatFollowers } from "./utils";

interface Props {
    conversation: InboxConversation;
    /** Mobile sheet shows a close button. */
    onClose?: () => void;
    /** Re-fetch this contact's name/avatar from Meta. */
    onResyncProfile?: () => Promise<void>;
}

const ContactPanel: React.FC<Props> = ({ conversation, onClose, onResyncProfile }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const router = useRouter();

    const c = conversation.contact;
    const followers = formatFollowers(c?.followerCount);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Contact details</Text>
                <View style={styles.headerActions}>
                    {onResyncProfile ? (
                        <ResyncInline
                            watch={conversation.updatedAt}
                            action={onResyncProfile}
                            label="Resync profile"
                        />
                    ) : null}
                    {onClose ? (
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={18} color={colors.text} />
                        </Pressable>
                    ) : null}
                </View>
            </View>

            <View style={styles.profile}>
                <ChannelAvatar
                    avatarUrl={conversation.participant.avatarUrl}
                    channel={conversation.channel}
                    size={72}
                    name={conversation.participant.name}
                    handle={conversation.participant.handle}
                />
                <Text style={styles.name}>{conversation.participant.name}</Text>
                {conversation.participant.handle ? (
                    <Text style={styles.handle}>
                        @{conversation.participant.handle} · {channelLabel(conversation.channel)}
                    </Text>
                ) : null}
            </View>

            {c?.isTrendlyInfluencer ? (
                <View style={[styles.influencerPill, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.influencerPillText, { color: colors.onPrimary }]}>
                        Trendly influencer
                    </Text>
                </View>
            ) : null}

            <View style={styles.metaList}>
                {followers ? (
                    <View style={styles.metaRow}>
                        <FontAwesomeIcon icon={faUserGroup} size={13} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{followers} followers</Text>
                    </View>
                ) : null}
                {c?.location ? (
                    <View style={styles.metaRow}>
                        <FontAwesomeIcon icon={faLocationDot} size={13} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{c.location}</Text>
                    </View>
                ) : null}
            </View>

            {c?.bio ? <Text style={styles.bio}>{c.bio}</Text> : null}

            {c?.isTrendlyInfluencer && c.linkedInfluencerId ? (
                <Pressable
                    onPress={() =>
                        router.push(`/(public)/influencer/${c.linkedInfluencerId}` as any)
                    }
                    style={[styles.crmBtn, { backgroundColor: colors.tag }]}
                >
                    <Text style={styles.crmBtnText}>View in CRM</Text>
                </Pressable>
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    backgroundColor: colors.background,
                    padding: 20,
                },
                headerRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                },
                headerTitle: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                },
                headerActions: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                },
                closeBtn: {
                    padding: 4,
                },
                profile: {
                    alignItems: "center",
                    gap: 10,
                },
                name: {
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                },
                handle: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    textAlign: "center",
                },
                influencerPill: {
                    alignSelf: "center",
                    marginTop: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 14,
                },
                influencerPillText: {
                    fontSize: 12,
                    fontWeight: "700",
                },
                metaList: {
                    marginTop: 20,
                    gap: 12,
                },
                metaRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                },
                metaText: {
                    fontSize: 14,
                    color: colors.text,
                },
                bio: {
                    marginTop: 16,
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.textSecondary,
                },
                crmBtn: {
                    marginTop: 24,
                    height: 44,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                },
                crmBtnText: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                },
            }),
        [colors]
    );
}

export default ContactPanel;
