import { useBrandContext } from '@/contexts/brand-context.provider'
import { ICollaboration } from '@/shared-libs/firestore/trendly-pro/models/collaborations'
import { Console } from '@/shared-libs/utils/console'
import { AuthApp } from '@/shared-libs/utils/firebase/auth'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { HttpWrapper } from '@/shared-libs/utils/http-wrapper'
import useBreakpoints from '@/shared-libs/utils/use-breakpoints'
import { Text, View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import Colors from '@/shared-uis/constants/Colors'
import { Collaboration } from '@/types/Collaboration'
import { User } from '@/types/User'
import { useTheme } from '@react-navigation/native'
import { collection, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore'
import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { Button, Card, Checkbox } from 'react-native-paper'

interface IProps {
    selectedInfluencer: User
}
const InfluencerInvite: React.FC<IProps> = ({ selectedInfluencer }) => {
    const { selectedBrand } = useBrandContext()
    const [collaborations, setCollaborations] = useState<Collaboration[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const theme = useTheme()
    const colors = Colors(theme)
    const { xl, width } = useBreakpoints()
    const styles = useMemo(() => useStyles(colors, xl, width), [colors, xl, width])

    const fetchCollaborations = async () => {
        const collaborationCol = collection(FirestoreDB, "collaborations");
        const q = query(
            collaborationCol,
            where("brandId", "==", selectedBrand?.id),
            where("status", "==", "active"),
            orderBy("timeStamp", "desc")
        );
        const docSnap = await getDocs(q)
        const collabs: Collaboration[] = []
        docSnap.forEach(doc => {
            collabs.push({
                ...(doc.data() as ICollaboration),
                id: doc.id
            })
        })
        setCollaborations(collabs)
    }

    useEffect(() => {
        fetchCollaborations()
    }, [])

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const sendInvite = async () => {
        try {
            setLoading(true)
            if (!selectedInfluencer) return;

            for (let i = 0; i < selectedIds.length; i++) {
                const collaborationId = selectedIds[i];
                const invitationColRef = collection(
                    FirestoreDB,
                    "collaborations",
                    collaborationId,
                    "invitations"
                );

                const invitationPayload = {
                    userId: selectedInfluencer.id,
                    managerId: AuthApp.currentUser?.uid,
                    collaborationId,
                    status: "pending",
                    message: "",
                };

                // Invitation Id as influencer id
                const invitationDocRef = doc(invitationColRef, selectedInfluencer.id);
                setDoc(invitationDocRef, invitationPayload).then(() => {
                    HttpWrapper.fetch(`/api/collabs/collaborations/${collaborationId}/invitations/${selectedInfluencer.id}`, {
                        method: "POST",
                    })
                });
            }
            Toaster.success("Invitation sent successfully");
        } catch (error) {
            Console.error(error);
            Toaster.error("Failed to send invitation");
        } finally {
            setLoading(false)
        }
    };

    if (collaborations.length == 0) {
        return null
    }

    const influencerName = selectedInfluencer?.name?.split(" ")[0] || "creator"

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.headerWrap}>
                    <Text style={styles.eyebrow}>Instant Invite</Text>
                    <Text style={styles.title}>Invite {influencerName} to live campaigns</Text>
                    <Text style={styles.subtitle}>Pick one or more active campaigns to send the collaboration request now.</Text>
                </View>

                <View style={styles.rowsWrap}>
                    {collaborations.map(collab => {
                        const selected = selectedIds.includes(collab.id)

                        return (
                            <TouchableOpacity
                                key={collab.id}
                                style={[styles.collabRow, selected && styles.collabRowSelected]}
                                onPress={() => toggleSelection(collab.id)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.rowLeft}>
                                    <Checkbox
                                        status={selected ? 'checked' : 'unchecked'}
                                        onPress={(event) => {
                                            event.stopPropagation()
                                            toggleSelection(collab.id)
                                        }}
                                        color={colors.primary}
                                        uncheckedColor={colors.textSecondary}
                                    />
                                    <Text numberOfLines={1} style={styles.collabName}>{collab.name}</Text>
                                </View>

                                <View style={[styles.statusPill, selected && styles.statusPillSelected]}>
                                    <Text style={[styles.statusText, selected && styles.statusTextSelected]}>
                                        {selected ? "Selected" : "Active"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                <View style={styles.metaWrap}>
                    <Text style={styles.metaText}>
                        {selectedIds.length} campaign{selectedIds.length === 1 ? "" : "s"} selected
                    </Text>
                </View>
            </Card.Content>
            <Card.Actions style={styles.actions}>
                <Button
                    mode="contained"
                    onPress={sendInvite}
                    loading={loading}
                    disabled={loading || selectedIds.length === 0}
                    contentStyle={styles.buttonContent}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                >
                    Send Invite
                </Button>
            </Card.Actions>
        </Card>
    )
}

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean, width: number) {
    const compact = width < 420

    return StyleSheet.create({
        card: {
            marginHorizontal: xl ? 16 : 10,
            marginVertical: 10,
            borderRadius: 22,
            paddingVertical: xl ? 14 : 8,
            paddingHorizontal: compact ? 2 : 6,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            shadowColor: colors.panelShadow,
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 20,
            elevation: 3,
        },
        headerWrap: {
            marginBottom: 12,
            gap: 6,
            backgroundColor: colors.transparent,
        },
        eyebrow: {
            fontSize: 12,
            letterSpacing: 0.9,
            fontWeight: "700",
            color: colors.primary,
            textTransform: "uppercase",
        },
        title: {
            fontSize: compact ? 18 : 20,
            lineHeight: compact ? 24 : 26,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 13,
            lineHeight: 20,
            color: colors.textSecondary,
        },
        rowsWrap: {
            gap: 10,
            marginTop: 8,
        },
        collabRow: {
            minHeight: 58,
            borderWidth: 1,
            borderRadius: 16,
            borderColor: colors.outline,
            paddingHorizontal: 8,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.tag,
        },
        collabRowSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.surface,
        },
        rowLeft: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
            marginRight: 12,
            backgroundColor: colors.transparent,
        },
        collabName: {
            fontSize: compact ? 14 : 15,
            fontWeight: "600",
            color: colors.text,
            flexShrink: 1,
        },
        statusPill: {
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: colors.outline,
            backgroundColor: colors.transparent,
        },
        statusPillSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.primary,
        },
        statusText: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        statusTextSelected: {
            color: colors.onPrimary,
        },
        metaWrap: {
            marginTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 10,
            backgroundColor: colors.transparent,
        },
        metaText: {
            fontSize: 12,
            color: colors.textSecondary,
            fontWeight: "500",
        },
        actions: {
            paddingHorizontal: 16,
            paddingBottom: 12,
            paddingTop: 2,
            justifyContent: "flex-end",
        },
        button: {
            borderRadius: 12,
            backgroundColor: colors.primary,
            width: compact ? "100%" : undefined,
            minWidth: compact ? undefined : 140,
        },
        buttonContent: {
            height: 42,
            paddingHorizontal: 16,
        },
        buttonLabel: {
            fontWeight: "700",
            letterSpacing: 0.2,
        },
    })
}

export default InfluencerInvite
