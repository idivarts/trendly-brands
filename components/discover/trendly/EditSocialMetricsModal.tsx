import React from 'react'
import { Modal, ScrollView } from 'react-native'
import { Button, Text, TextInput } from 'react-native-paper'

import { ISocials } from '@/shared-libs/firestore/trendly-pro/models/bq-socials'
import { View } from '@/shared-uis/components/theme/Themed'

interface EditSocialMetricsModalProps {
    visible: boolean
    social: ISocials | null
    editedSocial: Partial<ISocials>
    setEditedSocial: React.Dispatch<React.SetStateAction<Partial<ISocials>>>
    saveError: string | null
    onClose: () => void
    onSave: () => void
    isSaving: boolean
    hasChanges: boolean
}

const EditSocialMetricsModal: React.FC<EditSocialMetricsModalProps> = ({
    visible,
    social,
    editedSocial,
    setEditedSocial,
    saveError,
    onClose,
    onSave,
    isSaving,
    hasChanges,
}) => (
    <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
    >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', padding: 16 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, maxHeight: '85%', paddingVertical: 20, paddingHorizontal: 0 }}>
                <View style={{ paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                    <Text variant="headlineSmall">Edit Social Metrics</Text>
                </View>

                {saveError && (
                    <View style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#ffebee', borderBottomWidth: 1, borderBottomColor: '#ffcdd2' }}>
                        <Text style={{ color: '#c62828', fontSize: 14 }}>
                            {saveError}
                        </Text>
                    </View>
                )}

                <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
                    <Text variant="labelLarge" style={{ marginTop: 16, marginBottom: 6 }}>Name</Text>
                    <TextInput
                        mode="outlined"
                        label="Name"
                        value={editedSocial.name ?? social?.name ?? ''}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, name: text })}
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Bio</Text>
                    <TextInput
                        mode="outlined"
                        label="Bio"
                        value={editedSocial.bio ?? social?.bio ?? ''}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, bio: text })}
                        multiline
                        numberOfLines={3}
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Category</Text>
                    <TextInput
                        mode="outlined"
                        label="Category"
                        value={editedSocial.category ?? social?.category ?? ''}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, category: text })}
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Location</Text>
                    <TextInput
                        mode="outlined"
                        label="Location"
                        value={editedSocial.location ?? social?.location ?? ''}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, location: text })}
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Gender</Text>
                    <TextInput
                        mode="outlined"
                        label="Gender"
                        value={editedSocial.gender ?? social?.gender ?? ''}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, gender: text })}
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Niches (comma-separated)</Text>
                    <TextInput
                        mode="outlined"
                        label="Niches"
                        value={editedSocial.niches ? editedSocial.niches.join(', ') : (social?.niches?.join(', ') ?? '')}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, niches: text.split(',').map(n => n.trim()).filter(Boolean) })}
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Follower Count</Text>
                    <TextInput
                        mode="outlined"
                        label="Followers"
                        value={String(editedSocial.follower_count ?? social?.follower_count ?? '')}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, follower_count: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Following Count</Text>
                    <TextInput
                        mode="outlined"
                        label="Following"
                        value={String(editedSocial.following_count ?? social?.following_count ?? '')}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, following_count: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Content Count</Text>
                    <TextInput
                        mode="outlined"
                        label="Posts"
                        value={String(editedSocial.content_count ?? social?.content_count ?? '')}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, content_count: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Views Count</Text>
                    <TextInput
                        mode="outlined"
                        label="Total Views"
                        value={String(editedSocial.views_count ?? social?.views_count ?? '')}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, views_count: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Engagement Count</Text>
                    <TextInput
                        mode="outlined"
                        label="Total Engagements"
                        value={String(editedSocial.engagement_count ?? social?.engagement_count ?? '')}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, engagement_count: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Quality Score</Text>
                    <TextInput
                        mode="outlined"
                        label="Quality Score (0-100)"
                        value={String(editedSocial.quality_score ?? social?.quality_score ?? '')}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, quality_score: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        style={{ marginBottom: 12 }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 6 }}>Engagement Rate (%)</Text>
                    <TextInput
                        mode="outlined"
                        label="Engagement Rate"
                        value={String(editedSocial.engagement_rate ?? social?.engagement_rate ?? '')}
                        onChangeText={(text) => setEditedSocial({ ...editedSocial, engagement_rate: parseFloat(text) || 0 })}
                        keyboardType="decimal-pad"
                        style={{ marginBottom: 20 }}
                    />
                </ScrollView>

                <View style={{ paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0', flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onPress={onClose}>Cancel</Button>
                    <Button mode="contained" onPress={onSave} loading={isSaving} disabled={isSaving || !hasChanges}>
                        Save
                    </Button>
                </View>
            </View>
        </View>
    </Modal>
)

export default EditSocialMetricsModal
