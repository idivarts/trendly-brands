/**
 * The studio's own route group.
 *
 * It sits OUTSIDE the drawer on purpose. The studio is a full-bleed editing
 * surface: a persistent drawer and a bottom tab bar cost it roughly a fifth of
 * the screen, and the one thing an editor needs is the canvas as large as the
 * device allows. Being its own route also makes entering and leaving a real
 * navigation — a URL you can deep-link to and a back gesture that means
 * something — where the old studio was a `stage` state inside the content
 * screen that nothing could link to and the back button could not leave.
 */
import { Stack } from "expo-router";
import React from "react";

const StudioLayout = () => (
    <Stack
        screenOptions={{
            headerShown: false,
            // The studio draws its own header. A stack header here would stack
            // two of them on web.
            animation: "slide_from_bottom",
        }}
    />
);

export default StudioLayout;
