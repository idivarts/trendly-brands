import { Stack } from 'expo-router'
import React from 'react'

const CreateLayout = () => {
    return (
        <Stack screenOptions={{
            headerShown: false
        }}>
            <Stack.Screen
                name="hire-us"
                options={{
                    presentation: "formSheet",
                    gestureEnabled: true,
                }}
            />
        </Stack>
    )
}

export default CreateLayout