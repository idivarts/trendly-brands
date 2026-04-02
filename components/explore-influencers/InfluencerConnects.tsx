import { View } from '@/shared-uis/components/theme/Themed'
import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'

interface IProps {
    // all?: boolean
}
const InfluencerConnects: React.FC<IProps> = () => {
    const styles = useMemo(() => StyleSheet.create({
        row: {
            paddingHorizontal: 8,
            flexDirection: "row",
        },
    }), []);

    return (
        <View style={styles.row} />
    )
}

export default InfluencerConnects