import { useBreakpoints } from '@/hooks'
import { useMyNavigation } from '@/shared-libs/utils/router'
import { useConfirmationModel } from '@/shared-uis/components/ConfirmationModal'
import { View } from '@/shared-uis/components/theme/Themed'
import { useTheme } from '@react-navigation/native'
import React from 'react'
import { Chip, Text } from 'react-native-paper'

export const PremiumActionTag: React.FC<{
    label: string
    tooltip: string
    icon?: string
    variant?: 'gold' | 'purple'
    count?: number
    onPress?: () => void
}> = ({ label, tooltip, icon = 'star-circle', variant = 'gold', count = 0, onPress }) => {
    const theme = useTheme()
    const { xl } = useBreakpoints()
    const { openModal } = useConfirmationModel()
    const router = useMyNavigation()

    const palette = variant === 'gold'
        ? { bg: '#FFF6D1', border: '#E6B800', text: '#6B4E00' }
        : { bg: '#EEE8FF', border: '#8A63D2', text: '#3D2C7A' }

    return (
        <View>
            <Chip
                mode="outlined"
                compact
                onLongPress={() => { }}
                onPress={onPress}
                icon={icon}
                style={{
                    marginLeft: 8,
                    borderRadius: 16,
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                    borderWidth: 1,
                }}
                // contentStyle={{ paddingVertical: 4, paddingHorizontal: 10 }}
                textStyle={{
                    fontWeight: '700',
                    fontSize: 12,
                    lineHeight: 16,
                    color: palette.text,
                }}
            >
                <Text style={{ fontWeight: '800', marginRight: 4 }}>{count}</Text>
                {xl && label}
            </Chip>
        </View>
    )
}