import AppLayout from '@/layouts/app-layout';
import { IUsers } from '@/shared-libs/firestore/trendly-pro/models/users';
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore';
import { View } from '@/shared-uis/components/theme/Themed';
import Colors from '@/shared-uis/constants/Colors';
import { useTheme } from '@react-navigation/native';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';

const useStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        title: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
        scroll: { flex: 1, height: "100%" },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors(theme).background,
            borderRadius: 12,
            padding: 12,
            shadowColor: Colors(theme).eerieBlack,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        avatar: { width: 60, height: 60, borderRadius: 8, marginRight: 16 },
        flex1: { flex: 1 },
        name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
        email: { fontSize: 14, color: Colors(theme).gray100 },
        count: { fontSize: 18, fontWeight: 'bold' },
    });

interface InfluencerInterface { id: string, images: { imageUrl: string, id: string }[], totalImages: number, user?: IUsers }
const InfluencerList = () => {
    const theme = useTheme();
    const styles = useStyles(theme);

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
        <AppLayout safeAreaEdges={["top", "right", "bottom", "left"]}>
            <Text style={styles.title}>Influencer List - {influencerList.length}</Text>
            <ScrollView style={styles.scroll}>
                {influencerList.map((influencer, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.row}
                        onPress={() => window.open(`/influencer/${influencer.id}`, "_blank")}
                    >
                        <Image
                            source={{ uri: influencer.user?.profileImage }}
                            style={styles.avatar}
                        />
                        <View style={styles.flex1}>
                            <Text style={styles.name}>{influencer.user?.name}</Text>
                            <Text style={styles.email}>{influencer.user?.email}</Text>
                        </View>
                        <Text style={styles.count}>{influencer.images?.length + " / " + influencer.totalImages}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </AppLayout>

    )
}

export default InfluencerList