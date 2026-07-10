/**
 * DesignFrame (web) — renders the design HTML in an <iframe srcDoc> and bridges
 * messages via window.postMessage. The iframe IS the render surface, so the
 * html2canvas capture is pixel-identical to the preview.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { View } from "react-native";
import { buildFrameHtml, DesignFrameHandle, DesignFrameProps, FrameOutMsg } from "./bridge";

const DesignFrameWeb = forwardRef<DesignFrameHandle, DesignFrameProps>(
    ({ html, width, height, displayWidth, onMessage }, ref) => {
        const iframeRef = useRef<HTMLIFrameElement | null>(null);
        const scale = width > 0 ? displayWidth / width : 1;
        const displayHeight = height * scale;
        const srcDoc = useMemo(() => buildFrameHtml(html, scale, width, height), [html, scale, width, height]);

        const post = (msg: object) => {
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
        };

        useImperativeHandle(ref, () => ({
            setText: (id, text) => post({ type: "setText", id, text }),
            showSlide: (index, slideWidth) => post({ type: "showSlide", index, slideWidth }),
            captureAll: (count) => post({ type: "captureSlides", count }),
        }));

        useEffect(() => {
            const handler = (e: MessageEvent) => {
                if (typeof e.data !== "string") return;
                try {
                    onMessage(JSON.parse(e.data) as FrameOutMsg);
                } catch {
                    /* ignore non-bridge messages */
                }
            };
            window.addEventListener("message", handler);
            return () => window.removeEventListener("message", handler);
        }, [onMessage]);

        return (
            <View style={{ width: displayWidth, height: displayHeight, borderRadius: 12, overflow: "hidden" }}>
                {/* @ts-ignore — raw DOM iframe under react-native-web */}
                <iframe
                    ref={iframeRef as any}
                    srcDoc={srcDoc}
                    sandbox="allow-scripts allow-same-origin"
                    style={{ width: displayWidth, height: displayHeight, border: "0" }}
                    title="design-preview"
                />
            </View>
        );
    }
);

DesignFrameWeb.displayName = "DesignFrame";
export default DesignFrameWeb;
