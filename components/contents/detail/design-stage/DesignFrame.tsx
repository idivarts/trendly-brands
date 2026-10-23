/**
 * DesignFrame (native) — renders the design HTML in a react-native-webview and
 * bridges messages via ReactNativeWebView.postMessage / injectJavaScript.
 *
 * Preview only. The publishable PNG/MP4 comes from the server render worker,
 * which loads the same saved HTML in real Chromium — so this frame no longer
 * has to BE the render surface, and native is no longer locked out of video.
 */
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { buildFrameHtml, DesignFrameHandle, DesignFrameProps, FrameOutMsg } from "./bridge";

const DesignFrameNative = forwardRef<DesignFrameHandle, DesignFrameProps>(
    ({ html, width, height, displayWidth, onMessage }, ref) => {
        const webRef = useRef<WebView | null>(null);
        const scale = width > 0 ? displayWidth / width : 1;
        const displayHeight = height * scale;
        const source = useMemo(() => ({ html: buildFrameHtml(html, scale, width, height) }), [html, scale, width, height]);

        const send = (msg: object) => {
            const js = `window.__cmd(${JSON.stringify(JSON.stringify(msg))}); true;`;
            webRef.current?.injectJavaScript(js);
        };

        useImperativeHandle(ref, () => ({
            setText: (id, text) => send({ type: "setText", id, text }),
            deselect: () => send({ type: "deselect" }),
            showSlide: (index, slideWidth) => send({ type: "showSlide", index, slideWidth }),
            play: () => send({ type: "play" }),
            pause: () => send({ type: "pause" }),
            seek: (ms) => send({ type: "seek", ms }),
        }));

        return (
            <View style={{ width: displayWidth, height: displayHeight, borderRadius: 12, overflow: "hidden" }}>
                <WebView
                    ref={webRef}
                    originWhitelist={["*"]}
                    source={source}
                    javaScriptEnabled
                    domStorageEnabled
                    scrollEnabled={false}
                    style={{ width: displayWidth, height: displayHeight, backgroundColor: "transparent" }}
                    onMessage={(e) => {
                        try {
                            onMessage(JSON.parse(e.nativeEvent.data) as FrameOutMsg);
                        } catch {
                            /* ignore */
                        }
                    }}
                />
            </View>
        );
    }
);

DesignFrameNative.displayName = "DesignFrame";
export default DesignFrameNative;
