import AppLayout from '@/layouts/app-layout';
import { IUsers } from '@/shared-libs/firestore/trendly-pro/models/users';
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore';
import { View } from '@/shared-uis/components/theme/Themed';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Text, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';

interface InfluencerInterface { id: string, images: { imageUrl: string, id: string }[], totalImages: number, user?: IUsers }
const InfluencerList = () => {

    const [influencerList, setInfluencerList] = useState<InfluencerInterface[]>([])
    const [loading, setLoading] = useState(true)
    // const { push } = useMyNavigation()

    const getInfluencer = async () => {
        try {
            setLoading(true)
            const userImagesRef = collection(FirestoreDB, "userImages");
            const snapshot = await getDocs(userImagesRef);
            const list: (InfluencerInterface | undefined)[] = await Promise.all(snapshot.docs.map(async (docData) => {
                if (docData.id == "config")
                    return undefined
                const data = docData.data() as InfluencerInterface;
                const userDoc = await getDoc(doc(collection(FirestoreDB, "users"), docData.id));
                return {
                    ...data,
                    id: docData.id,
                    user: userDoc.data() as IUsers,
                };
            }));
            setInfluencerList(list.filter(l => l) as InfluencerInterface[]);
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        getInfluencer()
    }, [])

    if (Platform.OS != "web")
        return null
    if (loading) {
        <ActivityIndicator />
    }
    return (
        <AppLayout>
            <Text style={{ fontSize: 22, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 }}>Influencer List - {influencerList.length}</Text>
            <ScrollView style={{ flex: 1, height: "100%" }}>
                {influencerList.map((influencer, index) => (
                    <TouchableOpacity
                        key={index}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            borderRadius: 12,
                            padding: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                        onPress={() => window.open(`/influencer/${influencer.id}`, "_blank")}
                    >
                        <Image
                            source={{ uri: influencer.user?.profileImage }}
                            style={{ width: 60, height: 60, borderRadius: 8, marginRight: 16 }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>{influencer.user?.name}</Text>
                            <Text style={{ fontSize: 14, color: 'gray' }}>{influencer.user?.email}</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{influencer.images?.length + " / " + influencer.totalImages}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </AppLayout>

    )
}

export default InfluencerList