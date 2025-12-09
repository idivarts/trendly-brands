import React from "react";
import { Modal, Platform } from "react-native";
import { WebView } from "react-native-webview";

export default function RazorpayWebCheckout({ visible, onClose, options }: any) {
  if (!visible) return null;

  // ===== WEB PLATFORM =====
  if (Platform.OS === "web") {
    const openCheckout = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        const razorpay = new (window as any).Razorpay({
          ...options,
          handler: (response: any) => onClose(response),
          modal: {
            ondismiss: () => onClose(null),
          },
        });

        razorpay.open();
      };

      document.body.appendChild(script);
    };

    // Auto-open when visible becomes true
    openCheckout();

    return null;
  }

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
    <Modal visible={visible} transparent animationType="slide">
      <WebView
        source={{ html: htmlContent }}
        onMessage={(event) => {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.event === "SUCCESS") onClose(msg.data);
          if (msg.event === "DISMISS") onClose(null);
        }}
      />
    </Modal>
  );
}