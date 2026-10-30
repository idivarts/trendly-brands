/**
 * VideoSurface — expo-av's `Video`, sized correctly on web.
 *
 * `Video` renders TWO elements: an outer `View` that takes the `style` prop,
 * and the player itself, which takes `videoStyle`. On native that split is
 * invisible, because `videoStyle` defaults to an absolute fill of the outer
 * view. On WEB it is not:
 *
 *   ExponentVideo.web.js → const customStyle = { position: undefined, ... }
 *
 * The web path deliberately strips `position` from the player's style — so the
 * default `position:absolute; left/top/right/bottom: 0` becomes a `static`
 * element with no width and no height, and a `<video>` like that falls back to
 * its INTRINSIC size. A 1080x1920 clip is then laid out 1080x1920 CSS pixels
 * inside a box a third that size, with `overflow: hidden` on the outer view
 * cropping the rest: you see the clip's top-left corner, and the native
 * controls — which live at the bottom of the player — are outside the box
 * entirely. Styling `style` cannot fix it; that prop sizes the wrong element.
 *
 * So `videoStyle` must be set, every time, and this exists so that no call site
 * has to remember a fact this well hidden. Pass one through and it is merged
 * over the fill rather than replacing it.
 */
import { Video } from "expo-av";
import React from "react";
import { StyleSheet } from "react-native";

type VideoProps = React.ComponentProps<typeof Video>;

const VideoSurface = React.forwardRef<Video, VideoProps>(({ videoStyle, ...props }, ref) => (
    <Video ref={ref} {...props} videoStyle={[styles.fill, videoStyle]} />
));

VideoSurface.displayName = "VideoSurface";

const styles = StyleSheet.create({
    // Percentages, not an absolute fill: `position` is what the web path drops.
    fill: { width: "100%", height: "100%" },
});

export default VideoSurface;
