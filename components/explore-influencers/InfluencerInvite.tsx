import { useCollaborationContext } from '@/contexts'
import { useBrandContext } from '@/contexts/brand-context.provider'
import { ICollaboration } from '@/shared-libs/firestore/trendly-pro/models/collaborations'
import { Console } from '@/shared-libs/utils/console'
import { AuthApp } from '@/shared-libs/utils/firebase/auth'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { HttpWrapper } from '@/shared-libs/utils/http-wrapper'
import { Text, View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import Colors from '@/shared-uis/constants/Colors'
import { Collaboration } from '@/types/Collaboration'
import { User } from '@/types/User'
import { collection, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore'
import { useTheme } from '@react-navigation/native'
import React, { useEffect, useState } from 'react'
import { Button, Card, Checkbox } from 'react-native-paper'

interface IProps {
    selectedInfluencer: User
}
const InfluencerInvite: React.FC<IProps> = ({ selectedInfluencer }) => {
    const { } = useCollaborationContext()
    const { selectedBrand } = useBrandContext()
    const [collaborations, setCollaborations] = useState<Collaboration[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const theme = useTheme();

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
    return (
        <Card style={{ margin: 8, paddingVertical: 16 }}>
            <Card.Title title="You can invite this influencer to any of the below listed active campaign" />
            <Card.Content>
                {collaborations.map(collab => (
                    <View key={collab.id} style={{ flexDirection: "row-reverse", alignItems: 'center', marginBottom: 8, borderWidth: 0.5, borderRadius: 12, paddingHorizontal: 4, borderColor: Colors(theme).aliceBlue, justifyContent:"space-between" }}>
                        <Checkbox
                            status={selectedIds.includes(collab.id) ? 'checked' : 'unchecked'}
                            onPress={() => toggleSelection(collab.id)}
                        />
                        <Text style={{ fontSize: 16 }}>{collab.name}</Text>x
                    </View>
                ))}
            </Card.Content>
            <Card.Actions>
                <Button mode="contained" onPress={sendInvite} loading={loading}>
                    Send Invite
                </Button>
            </Card.Actions>
        </Card>
    )
}

export default InfluencerInvite
