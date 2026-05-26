import { useBrandContext } from "@/contexts/brand-context.provider";
import { aiWS } from "@/utils/ai-ws";
import { useCallback, useEffect, useRef, useState } from "react";

interface RunEditArgs {
    selectedText: string;
    prompt: string;
    model?: string;
    module: string;
    contextId?: string;
}

export function useAIQuickEdit() {
    const { selectedBrand } = useBrandContext();
    const [result, setResult] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const activeRef = useRef(false);
    const accumRef = useRef("");

    useEffect(() => {
        const remove = aiWS.addListener((msg: any) => {
            if (!activeRef.current) return;
            if (msg.type === "token" && typeof msg.delta === "string") {
                accumRef.current += msg.delta;
                setResult(accumRef.current);
            } else if (msg.type === "done") {
                activeRef.current = false;
                setIsStreaming(false);
            } else if (msg.type === "error") {
                activeRef.current = false;
                setIsStreaming(false);
            }
        });
        return remove;
    }, []);

    const runEdit = useCallback(
        async ({ selectedText, prompt, model, module, contextId }: RunEditArgs) => {
            const brandId = selectedBrand?.id;
            if (!brandId) return;
            accumRef.current = "";
            setResult("");
            setIsStreaming(true);
            activeRef.current = true;
            await aiWS.send({
                type: "quick_edit",
                brandId,
                selectedText,
                prompt,
                model,
                module,
                contextId,
            });
        },
        [selectedBrand?.id]
    );

    const reset = useCallback(() => {
        accumRef.current = "";
        setResult("");
        setIsStreaming(false);
        activeRef.current = false;
    }, []);

    return { result, isStreaming, runEdit, reset };
}
