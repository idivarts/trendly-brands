import React, { useEffect } from "react";
import { Modal, Platform, View } from "react-native";
import { WebView } from "react-native-webview";

export default function RazorpayWebCheckout({
    visible,
    onClose,
    options,
}: any) {
    // ===== WEB PLATFORM =====
    if (Platform.OS === "web") {
        useEffect(() => {
            if (!visible) return;

            const existingScript = document.querySelector(
                'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            );

            const initRazorpay = () => {
                const razorpay = new (window as any).Razorpay({
                    ...options,
                    handler: (response: any) => onClose(response),
                    modal: {
                        ondismiss: () => onClose(null),
                    },
                });
                razorpay.open();
            };

            if (existingScript || (window as any).Razorpay) {
                initRazorpay();
            } else {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = initRazorpay;
                script.onerror = () => onClose(null);
                document.body.appendChild(script);
            }
        }, [visible, options, onClose]);
        return null;
    }
    if (!visible) return null;

    // ===== MOBILE PLATFORM (iOS/Android) =====
    const htmlContent = `
    <html>
    <head>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>
    <body>
      <script>
        var options = ${JSON.stringify(options)};
        
        options.handler = function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: "SUCCESS",
            data: response
          }));
        };

        options.modal = {
          ondismiss: function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: "DISMISS"
            }));
          }
        };

        var razorpay = new Razorpay(options);
        razorpay.open();
      </script>
    </body>
    </html>
  `;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
        >
            <View
                style={{
                    flex: 1,
                    marginTop: 60,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    overflow: "hidden",
                }}
            >
                <WebView
                    source={{ html: htmlContent }}
                    onMessage={(event) => {
                        const msg = JSON.parse(event.nativeEvent.data);
                        if (msg.event === "SUCCESS") onClose(msg.data);
                        if (msg.event === "DISMISS") onClose(null);
                    }}
                />
            </View>
        </Modal>
    );
}
