import { useMyGrowthBook } from '@/contexts/growthbook-context-provider'
import React from 'react'
import { ActivityIndicator } from 'react-native-paper'

const GrowthBookProtected: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { loading } = useMyGrowthBook()
    if (!loading)
        return <ActivityIndicator />
    return (
        children
    )
}

export default GrowthBookProtected