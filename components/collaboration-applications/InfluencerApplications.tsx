import { Text, View } from '@/shared-uis/components/theme/Themed'
import React from 'react'

interface IInfluencerApplication {
    collaborationId: string,
    applicationId: string
}

const InfluencerApplication: React.FC<IInfluencerApplication> = ({ collaborationId, applicationId }) => {

    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>Hello there</Text>
        </View>
    )
}

export default InfluencerApplication