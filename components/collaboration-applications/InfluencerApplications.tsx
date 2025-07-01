import { IApplications } from '@/shared-libs/firestore/trendly-pro/models/collaborations'
import { IUsers } from '@/shared-libs/firestore/trendly-pro/models/users'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import ProfileBottomSheet from '@/shared-uis/components/ProfileModal/Profile-Modal'
import { View } from '@/shared-uis/components/theme/Themed'
import { User } from '@/types/User'
import { useTheme } from '@react-navigation/native'
import { collection, doc, getDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { ActivityIndicator } from 'react-native-paper'

interface IInfluencerApplication {
    collaborationId: string,
    applicationId: string
}

const InfluencerApplication: React.FC<IInfluencerApplication> = ({ collaborationId, applicationId }) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const theme = useTheme()

    const [influencer, setInfluencer] = useState<User | undefined>(undefined)

    const initiate = async () => {
        setLoading(true)
        try {
            const applicationRef = doc(collection(FirestoreDB, "collaborations", collaborationId, "applications"), applicationId)
            const applicationDoc = await getDoc(applicationRef)
            if (!applicationDoc.exists()) {
                setError(true)
                return;
            }
            const application = applicationDoc.data() as IApplications
            const userId = application.userId

            const userRef = doc(collection(FirestoreDB, "users"), userId)
            const userDoc = await getDoc(userRef)
            if (!userDoc.exists()) {
                setError(true)
                return;
            }
            const user = await userDoc.data() as IUsers
            setInfluencer({
                ...user,
                id: userDoc.id
            })

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        initiate()
    }, [])

    if (loading) {
        return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size={"small"} />
        </View>
    }
    if (error || !influencer) {
        return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "red", fontSize: 16 }}>Something went wrong. Unable to load application details.</Text>
        </View>
    }
    return (
        <View style={{ flex: 1, alignItems: "stretch", justifyContent: "center" }}>
            <ProfileBottomSheet FireStoreDB={FirestoreDB} influencer={influencer} isBrandsApp={true} theme={theme} isPhoneMasked={false} />
        </View>
    )
}

export default InfluencerApplication