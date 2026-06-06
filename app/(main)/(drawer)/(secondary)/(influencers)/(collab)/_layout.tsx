import { Stack } from 'expo-router'
import React from 'react'

const CreateLayout = () => {
    return (
        <Stack screenOptions={{
            headerShown: false
        }}>
            <Stack.Screen
                name="create-collaboration"
                options={{
                    presentation: "formSheet",
                    gestureEnabled: true,
                }}
            />
            <Stack.Screen name="edit-collaboration" />
        </Stack>
    )
}

export default CreateLayout