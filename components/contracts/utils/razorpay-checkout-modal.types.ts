export type RazorpayCheckoutModalOptions = Record<string, unknown>;

export type RazorpayCheckoutModalProps = {
    visible: boolean;
    options: RazorpayCheckoutModalOptions;
    onSuccess: (data: unknown) => void;
    onClose: () => void;
    onError?: (err: unknown) => void;
};
