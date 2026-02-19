import { useNiche } from "@/contexts";
import { useCallback, useState } from "react";

interface NicheSearchResult {
    niche: string;
    appearance_count: number;
}

export const useNicheSearch = () => {
    const { searchNiches, niches, nicheItems, isLoading } = useNiche();
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback(
        async (query: string): Promise<string[]> => {
            if (!query || query.trim() === "") {
                setSearchResults([]);
                return niches;
            }

            setIsSearching(true);
            try {
                const results = await searchNiches(query);
                const nicheNames = results.map((item) => item.niche);
                setSearchResults(nicheNames);
                return nicheNames;
            } catch (error) {
                console.error("Error searching niches:", error);
                // Fallback to local filtering
                const localResults = niches.filter((niche) =>
                    niche.toLowerCase().includes(query.toLowerCase())
                );
                setSearchResults(localResults);
                return localResults;
            } finally {
                setIsSearching(false);
            }
        },
        [searchNiches, niches]
    );

    const getAllNiches = useCallback((): string[] => {
        return searchResults.length > 0 ? searchResults : niches;
    }, [searchResults, niches]);

    return {
        handleSearch,
        searchResults,
        isSearching,
        isLoading,
        niches,
        nicheItems,
        getAllNiches,
    };
};
