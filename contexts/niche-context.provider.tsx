import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAuthContext } from "./auth-context.provider";

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
const NICHE_TIMESTAMP_KEY = "trendly_niches_timestamp";
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

interface NicheProviderProps {
    children: ReactNode;
}

export const NicheProvider = ({ children }: NicheProviderProps) => {
    const { manager, session } = useAuthContext();
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
            // Check if user is authenticated
            if (!session) {
                console.log("User not authenticated, skipping niche fetch");
                return [];
            }

            const url = `/discovery/brands/niches?offset=${offset}&limit=${limit}&search=${encodeURIComponent(search)}`;

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
            });

            const fetchPromise = HttpWrapper.fetch(url, {
                method: "GET",
            });

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            const result = await response.json();
            return result.data || [];
        } catch (err) {
            console.error("Error fetching niches:", err);
            // Return empty array instead of throwing to prevent loader from getting stuck
            return [];
        }
    };

    // Check if cache is expired
    const isCacheExpired = async (): Promise<boolean> => {
        try {
            const timestamp = await AsyncStorage.getItem(NICHE_TIMESTAMP_KEY);
            if (!timestamp) return true;

            const cacheAge = Date.now() - parseInt(timestamp, 10);
            return cacheAge > CACHE_DURATION;
        } catch (err) {
            console.error("Error checking cache expiry:", err);
            return true;
        }
    };

    // Load niches from localStorage
    const loadNichesFromStorage = async (): Promise<NicheItem[] | null> => {
        try {
            const cachedData = await AsyncStorage.getItem(NICHE_STORAGE_KEY);
            if (!cachedData) return null;

            return JSON.parse(cachedData);
        } catch (err) {
            console.error("Error loading niches from storage:", err);
            return null;
        }
    };

    // Save niches to localStorage
    const saveNichesToStorage = async (data: NicheItem[]): Promise<void> => {
        try {
            await AsyncStorage.setItem(NICHE_STORAGE_KEY, JSON.stringify(data));
            await AsyncStorage.setItem(NICHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (err) {
            console.error("Error saving niches to storage:", err);
        }
    };

    // Load initial niches or refresh from API
    const loadNiches = async (forceRefresh: boolean = false): Promise<void> => {
        try {
            // Don't try to load if user is not authenticated
            if (!session) {
                console.log("User not authenticated, using cached niches only");
                const cachedNiches = await loadNichesFromStorage();
                if (cachedNiches && cachedNiches.length > 0) {
                    setNicheItems(cachedNiches);
                    setNiches(cachedNiches.map((item) => item.niche));
                }
                return;
            }

            setIsLoading(true);
            setError(null);

            // Check cache first
            if (!forceRefresh) {
                const cacheExpired = await isCacheExpired();
                if (!cacheExpired) {
                    const cachedNiches = await loadNichesFromStorage();
                    if (cachedNiches && cachedNiches.length > 0) {
                        setNicheItems(cachedNiches);
                        setNiches(cachedNiches.map((item) => item.niche));
                        setIsLoading(false);
                        return;
                    }
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
    };

    // Refresh niches (force refresh from API)
    const refreshNiches = useCallback(async (): Promise<void> => {
        await loadNiches(true);
    }, []);

    // Search niches (async search)
    const searchNiches = useCallback(
        async (query: string): Promise<NicheItem[]> => {
            try {
                // Don't search if user is not authenticated
                if (!session) {
                    console.log("User not authenticated, returning empty results");
                    return [];
                }

                const results = await fetchNichesFromAPI(20, 0, query);
                return results;
            } catch (err) {
                console.error("Error searching niches:", err);
                return [];
            }
        },
        [session]
    );

    // Load niches on mount and check cache on every page load
    useEffect(() => {
        // Delay loading slightly to ensure auth is initialized
        const timer = setTimeout(() => {
            if (session) {
                loadNiches().catch(err => {
                    console.error("Failed to load niches:", err);
                });
            } else {
                // Just load from cache if no user
                loadNichesFromStorage().then(cached => {
                    if (cached && cached.length > 0) {
                        setNicheItems(cached);
                        setNiches(cached.map((item) => item.niche));
                    }
                }).catch(err => {
                    console.error("Failed to load cached niches:", err);
                });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [session]); // Only re-run when auth state changes

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