import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState
} from "react";

interface NicheItem {
    niche: string;
    appearance_count: number;
}

interface NicheContextProps {
    niches: string[];
    nicheItems: NicheItem[];
    isLoading: boolean;
    error: string | null;
    searchNiches: (query: string) => Promise<NicheItem[]>;
    refreshNiches: () => Promise<void>;
}

const NicheContext = createContext<NicheContextProps | undefined>(undefined);

const NICHE_STORAGE_KEY = "trendly_niches_cache";
const NICHE_CACHE_TTL_HOURS = 12;

interface NicheProviderProps {
    children: ReactNode;
}

export const NicheProvider = ({ children }: NicheProviderProps) => {
    const [niches, setNiches] = useState<string[]>([]);
    const [nicheItems, setNicheItems] = useState<NicheItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch niches from API
    const fetchNichesFromAPI = async (
        limit: number = 10,
        offset: number = 0,
        search: string = ""
    ): Promise<NicheItem[]> => {
        try {
            const url = `/discovery/brands/niches?offset=${offset}&limit=${limit}&search=${encodeURIComponent(search)}`;

            const response = await HttpWrapper.fetch(url, {
                method: "GET",
            });

            const result = await response.json();
            return result.data || [];
        } catch (err) {
            console.error("Error fetching niches:", err);
            // Return empty array instead of throwing to prevent loader from getting stuck
            return [];
        }
    };

    // Load niches from cache
    const loadNichesFromStorage = async (): Promise<NicheItem[] | null> => {
        try {
            return await PersistentStorage.getItemWithExpiry(NICHE_STORAGE_KEY);
        } catch (err) {
            console.error("Error loading niches from storage:", err);
            return null;
        }
    };

    // Save niches to cache
    const saveNichesToStorage = async (data: NicheItem[]): Promise<void> => {
        try {
            await PersistentStorage.setItemWithExpiry(
                NICHE_STORAGE_KEY,
                data,
                NICHE_CACHE_TTL_HOURS
            );
        } catch (err) {
            console.error("Error saving niches to storage:", err);
        }
    };

    // Load initial niches or refresh from API
    const loadNiches = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            if (!forceRefresh) {
                const cachedNiches = await loadNichesFromStorage();
                if (cachedNiches && cachedNiches.length > 0) {
                    setNicheItems(cachedNiches);
                    setNiches(cachedNiches.map((item) => item.niche));
                    return;
                }
            }

            // Fetch from API
            const fetchedNiches = await fetchNichesFromAPI(10); // First 10 popular niches

            if (fetchedNiches && fetchedNiches.length > 0) {
                setNicheItems(fetchedNiches);
                setNiches(fetchedNiches.map((item) => item.niche));
                await saveNichesToStorage(fetchedNiches);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load niches");
            console.error("Error loading niches:", err);

            // Try to load from cache as fallback
            const cachedNiches = await loadNichesFromStorage();
            if (cachedNiches && cachedNiches.length > 0) {
                setNicheItems(cachedNiches);
                setNiches(cachedNiches.map((item) => item.niche));
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh niches (force refresh from API)
    const refreshNiches = useCallback(async (): Promise<void> => {
        await loadNiches(true);
    }, [loadNiches]);

    // Search niches (async search)
    const searchNiches = useCallback(async (query: string): Promise<NicheItem[]> => {
        try {
            return await fetchNichesFromAPI(20, 0, query);
        } catch (err) {
            console.error("Error searching niches:", err);
            return [];
        }
    }, []);

    // Load niches once when the provider mounts.
    useEffect(() => {
        loadNiches().catch((err) => {
            console.error("Failed to load niches:", err);
        });
    }, []);

    const value: NicheContextProps = {
        niches,
        nicheItems,
        isLoading,
        error,
        searchNiches,
        refreshNiches,
    };

    return (
        <NicheContext.Provider value={value}>
            {children}
        </NicheContext.Provider>
    );
};

export const useNiche = (): NicheContextProps => {
    const context = useContext(NicheContext);
    if (!context) {
        // Return default values instead of throwing to prevent crashes
        console.warn("useNiche called outside of NicheProvider, returning defaults");
        return {
            niches: [],
            nicheItems: [],
            isLoading: false,
            error: null,
            searchNiches: async () => [],
            refreshNiches: async () => { },
        };
    }
    return context;
};