import { useCollaborationContext } from '@/contexts'
import { useBrandContext } from '@/contexts/brand-context.provider'
import { ICollaboration } from '@/shared-libs/firestore/trendly-pro/models/collaborations'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { Text, View } from '@/shared-uis/components/theme/Themed'
import { Collaboration } from '@/types/Collaboration'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Button, Card, Checkbox } from 'react-native-paper'

const InfluencerInvite = () => {
    const { } = useCollaborationContext()
    const { selectedBrand } = useBrandContext()
    const [collaborations, setCollaborations] = useState<Collaboration[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const fetchCollaborations = async () => {
        const collaborationCol = collection(FirestoreDB, "collaborations");
        const q = query(
            collaborationCol,
            where("brandId", "==", selectedBrand?.id),
            where("status", "!=", "inactive"),
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

    const sendInvite = () => {
        console.log('Inviting to:', selectedIds)
    }

    if (collaborations.length == 0)
        return []
    return (
        <Card style={{ margin: 8, paddingVertical: 16 }}>
            <Card.Title title="You can invite this influencer to any of the below listed active campaign" />
            <Card.Content>
                {collaborations.map(collab => (
                    <View key={collab.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Checkbox
                            status={selectedIds.includes(collab.id) ? 'checked' : 'unchecked'}
                            onPress={() => toggleSelection(collab.id)}
                        />
                        <Text style={{ fontSize: 16 }}>{collab.name}</Text>
                    </View>
                ))}
            </Card.Content>
            <Card.Actions>
                <Button mode="contained" onPress={sendInvite}>
                    Send Invite
                </Button>
            </Card.Actions>
        </Card>
    )
}

export default InfluencerInvite