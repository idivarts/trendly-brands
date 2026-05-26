import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useCallback, useEffect, useState } from "react";

export interface AIModel {
    id: string;
    displayName: string;
    provider: string;
    minTier: "starter" | "growth" | "pro" | "enterprise";
    multimodal?: boolean;
    unlocked: boolean;
}

const STORAGE_KEY = "ai.selectedModel";
const DEFAULT_MODEL = "openai/gpt-4o";

export function useAIModels() {
    const { selectedBrand } = useBrandContext();
    const [models, setModels] = useState<AIModel[]>([]);
    const [tier, setTier] = useState<string>("starter");
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModelState] = useState<string>(DEFAULT_MODEL);

    useEffect(() => {
        PersistentStorage.get(STORAGE_KEY).then((v) => {
            if (v) setSelectedModelState(v);
        });
    }, []);

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId) {
            setModels([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await HttpWrapper.fetch(`/api/ai/models?brandId=${brandId}`);
                const data = await res.json();
                if (cancelled) return;
                setModels(data.models ?? []);
                setTier(data.tier ?? "starter");
            } catch {
                if (cancelled) return;
                setModels([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedBrand?.id]);

    const setSelectedModel = useCallback(async (id: string) => {
        setSelectedModelState(id);
        await PersistentStorage.set(STORAGE_KEY, id);
    }, []);

    return { models, tier, loading, selectedModel, setSelectedModel };
}
