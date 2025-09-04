import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { useMyNavigation } from '@/shared-libs/utils/router'
import { useConfirmationModel } from '@/shared-uis/components/ConfirmationModal'
import { View } from '@/shared-uis/components/theme/Themed'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Chip } from 'react-native-paper'


const InfluencerConnects: React.FC = () => {
    const { selectedBrand } = useBrandContext()
    const { xl } = useBreakpoints()
    const { openModal } = useConfirmationModel()
    const router = useMyNavigation()
    return (
        <View style={{ padding: 8 }}>
            <Chip
                style={{
                    backgroundColor: '#FFD700', // Golden color
                    borderRadius: 20,
                }}
                textStyle={{
                    fontWeight: 'bold',
                    color: '#000',
                }}
                icon={() => (
                    <MaterialCommunityIcons name="account-multiple" size={18} color="#000" />
                )}
                onPress={() => {
                    openModal({
                        title: "Upgrade for more connects",
                        description: "Influencer Connects let you unlock influencer profiles even if they haven’t applied to your campaign. This allows you to reach out directly, even if they haven’t shown interest yet.",
                        confirmText: "Upgrade Now",
                        confirmAction: () => {
                            router.push("/billing")
                        }
                    })
                }}
            >
                {selectedBrand?.unlockCredits || 0} {xl && "Connects"}
            </Chip>
        </View>
    )
}

export default InfluencerConnects