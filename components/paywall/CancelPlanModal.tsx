import Colors from '@/constants/Colors'
import { useBrandContext } from '@/contexts/brand-context.provider'
import { HttpWrapper } from '@/shared-libs/utils/http-wrapper'
import { useMyNavigation } from '@/shared-libs/utils/router'
import { Text } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import { useTheme } from '@react-navigation/native'
import React, { useState } from 'react'
import { View } from 'react-native'
import { Button, IconButton, Modal, Portal, RadioButton } from 'react-native-paper'
import TextInput from '../ui/text-input'

const reasons = [
    'Too expensive',
    'Did not find enough influencers',
    'Was just exploring',
    'Not satisfied with support',
    'Other'
]

const CancelPlanModal: React.FC<{ onClose: Function }> = ({ onClose }) => {
    const { selectedBrand } = useBrandContext()
    const router = useMyNavigation()
    const [selectedReason, setSelectedReason] = useState('')
    const [customNote, setCustomNote] = useState('')
    const [loading, setLoading] = useState(false)
    const theme = useTheme()

    const cancelPlan = async () => {
        console.log('Cancel plan with reason:', selectedReason, 'and note:', customNote)
        try {
            setLoading(true)
            await HttpWrapper.fetch("/razorpay/cancel-subscription", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    brandId: selectedBrand?.id,
                    reason: selectedReason,
                    note: customNote
                })
            }).then(() => {
                router.resetAndNavigate("/pay-wall")
            })
            // Write Logic to cancel the plan
        } catch (err) {
            Toaster.error("Something went wrong!!")
        } finally {
            setLoading(false)
        }
    }
    return (
        <Portal>
            <Modal visible={true} contentContainerStyle={{ backgroundColor: Colors(theme).card, margin: 20, padding: 20, borderRadius: 8, alignSelf: "center", maxWidth: 600 }} onDismiss={() => onClose()} dismissable={true}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 20, marginBottom: 16 }}>Are you sure you want to cancel? </Text>
                    <IconButton icon="close" onPress={() => onClose()} />
                </View>
                <Text style={{ fontSize: 16, marginBottom: 16 }}>We would hate to let you go. Still, if you made your mind, we would like to know the reason to improove our platform</Text>
                <RadioButton.Group onValueChange={setSelectedReason} value={selectedReason}>
                    {reasons.map((reason, index) => (
                        <RadioButton.Item key={index} label={reason} value={reason} />
                    ))}
                </RadioButton.Group>

                <TextInput
                    label="Additional note (optional)"
                    value={customNote}
                    onChangeText={setCustomNote}
                    multiline
                    numberOfLines={4}
                    style={{ marginTop: 16, marginBottom: 24 }}
                />

                <Button mode="contained" onPress={() => cancelPlan()} disabled={!selectedReason} loading={loading}>
                    Cancel Plan
                </Button>
            </Modal>
        </Portal>
    )
}

export default CancelPlanModal