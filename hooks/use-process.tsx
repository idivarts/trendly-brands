import { useState } from "react";

interface useProcessType {
    isProcessing: boolean;
    processMessage: string;
    processPercentage: number;
    setIsProcessing: (isProcessing: boolean) => void;
    setProcessMessage: (message: string) => void;
    setProcessPercentage: (percentage: number) => void;
};

const useProcess = (): useProcessType => {
    const [processMessage, setProcessMessage] = useState('');
    const [processPercentage, setProcessPercentage] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    return {
        isProcessing,
        processMessage,
        processPercentage,
        setIsProcessing,
        setProcessMessage,
        setProcessPercentage,
    }
};

export default useProcess;
