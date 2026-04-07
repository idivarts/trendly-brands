declare module "react-native-razorpay" {
    const RazorpayCheckout: {
        open(options: Record<string, unknown>): Promise<unknown>;
    };
    export default RazorpayCheckout;
}
