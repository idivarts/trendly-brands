import { Attachment } from '@/shared-libs/firestore/trendly-pro/constants/attachment'
import { IApplications, ICollaboration } from '@/shared-libs/firestore/trendly-pro/models/collaborations'
import { IUsers } from '@/shared-libs/firestore/trendly-pro/models/users'
import { Console } from '@/shared-libs/utils/console'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import ProfileBottomSheet from '@/shared-uis/components/ProfileModal/Profile-Modal'
import { View } from '@/shared-uis/components/theme/Themed'
import { User } from '@/types/User'
import { useTheme } from '@react-navigation/native'
import { collection, doc, getDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Platform, Text } from 'react-native'
import { ActivityIndicator } from 'react-native-paper'

interface IInfluencerApplication {
    collaborationId?: string,
    influencerId: string
}

const InfluencerApplication: React.FC<IInfluencerApplication> = ({ collaborationId, influencerId }) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const theme = useTheme()

    const [influencer, setInfluencer] = useState<User | undefined>(undefined)
    const [application, setApplication] = useState<IApplications | undefined>(undefined)
    const [collaboration, setCollaboration] = useState<ICollaboration | undefined>(undefined)

    const initiate = async () => {
        setLoading(true)
        try {
            let applicationLocal: IApplications | null = null;
            if (collaborationId) {
                const applicationRef = doc(collection(FirestoreDB, "collaborations", collaborationId, "applications"), influencerId)
                const applicationDoc = await getDoc(applicationRef)
                if (!applicationDoc.exists()) {
                    setError(true)
                    return;
                }
                applicationLocal = applicationDoc.data() as IApplications
                setApplication(applicationLocal)

                const collaborationRef = doc(collection(FirestoreDB, "collaborations"), collaborationId)
                const collaborationDoc = await getDoc(collaborationRef)
                if (!collaborationDoc.exists()) {
                    setError(true)
                    return;
                }
                const collaboration = collaborationDoc.data() as ICollaboration
                setCollaboration(collaboration)
            }

            const userId = influencerId
            const userRef = doc(collection(FirestoreDB, "users"), userId)
            const userDoc = await getDoc(userRef)
            if (!userDoc.exists()) {
                setError(true)
                return;
            }
            const user = await userDoc.data() as IUsers

            const showImages = Platform.OS == "web" && window.location.hostname == "localhost"
            if (showImages) {
                const userImagesRef = doc(collection(FirestoreDB, "userImages"), userId)
                const userImagesDoc = await getDoc(userImagesRef)
                if (userImagesDoc.exists()) {
                    const userImages = await userImagesDoc.data() as { images: { imageUrl: string }[] }
                    Console.log("User Images", userImages);

                    const data: Attachment[] = userImages?.images.map(i => ({
                        type: "image",
                        imageUrl: i.imageUrl
                    })) || []
                    if (user.profile)
                        user.profile.attachments = [...data, {
                            type: "image",
                            imageUrl: "https://d1tfun8qrz04mk.cloudfront.net/uploads/file_1751392603_images-1751392601990-Profile%20Images%20v2.png"
                        }, ...(user.profile?.attachments || [])]
                }
            }
            setInfluencer({
                ...user,
                profile: {
                    ...user.profile,
                    attachments: applicationLocal ? [...applicationLocal.attachments, {
                        type: "image",
                        imageUrl: "https://d1tfun8qrz04mk.cloudfront.net/uploads/file_1751392603_images-1751392601990-Profile%20Images%20v2.png"
                    }, ...(user.profile?.attachments || [])] : user.profile?.attachments,
                },
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
            <ProfileBottomSheet FireStoreDB={FirestoreDB}
                influencer={influencer}
                actionCard={
                    (!!application && !!collaboration) ?
                        <View style={{ padding: 20, gap: 24 }}>
                            <View>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, lineHeight: 26 }}>
                                    Message from {influencer.name}
                                </Text>
                                <Text style={{ fontSize: 17, lineHeight: 26 }}>
                                    {application?.message}
                                </Text>
                            </View>

                            {/*     "imageUrl": "https://d1tfun8qrz04mk.cloudfront.net/uploads/file_1751392603_images-1751392601990-Profile%20Images%20v2.png", */}
                            <View>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, lineHeight: 26 }}>
                                    Questions we asked {influencer.name}
                                </Text>
                                {application?.answersFromInfluencer.map((v, index) => (
                                    <View key={index} style={{ marginBottom: 20 }}>
                                        <Text style={{ fontSize: 17, fontWeight: '600', marginBottom: 6, lineHeight: 24 }}>
                                            Q. {(collaboration?.questionsToInfluencers || [])[v.question]}
                                        </Text>
                                        <Text style={{ fontSize: 17, lineHeight: 24 }}>
                                            Ans. {v.answer}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View style={{ borderTopWidth: 1, borderColor: '#ddd', marginTop: 24, paddingTop: 20 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, lineHeight: 26 }}>
                                    {influencer.name}'s Profile
                                </Text>
                            </View>
                        </View> : null
                }
                isBrandsApp={true} theme={theme} isPhoneMasked={false} />
        </View>
    )
}

export default InfluencerApplication