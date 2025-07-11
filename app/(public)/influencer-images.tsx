import AppLayout from '@/layouts/app-layout';
import { IUsers } from '@/shared-libs/firestore/trendly-pro/models/users';
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
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
            const finalInfluencer = list.filter(l => l).sort((a, b) => {
                return ((b?.user?.lastUseTime || 0) - (a?.user?.lastUseTime || 0))
            })
            setInfluencerList(finalInfluencer as InfluencerInterface[]);
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        getInfluencer()
    }, [])

    if (Platform.OS != "web" || window.location.hostname != "localhost")
        return null
    if (loading) {
        <ActivityIndicator />
    }
    return (
        <AppLayout>
            <Text style={{ fontSize: 22, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 }}>Influencer List - {influencerList.length}</Text>
            <ScrollView style={{ flex: 1, height: "100%" }}>
                <FlashList
                    data={influencerList}
                    renderItem={({ item, index }) => {
                        return <View>
                            <Text
                                onPress={() => window.open(`/influencer/${item.id}`, "_blank")}
                                style={{ padding: 16 }}
                            >{index}. {item.user?.name} : {item.id} - {item.images.length} / {item.totalImages}</Text>
                            <FlashList
                                data={item.images}
                                renderItem={({ item }) => {
                                    return <Image
                                        source={{ uri: item.imageUrl }}
                                        style={{ width: 150, height: 300, borderRadius: 8, marginRight: 16, borderWidth: 1 }}
                                    />
                                }}
                                horizontal={true} />
                        </View>
                    }}
                />

            </ScrollView>
        </AppLayout >

    )
}

export default InfluencerList