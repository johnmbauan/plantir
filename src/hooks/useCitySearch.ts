import { useState, useCallback, useEffect } from "react";
import type { GeocodingResult } from "@/services/weatherService";
import { searchCities } from "@/services/weatherService";

const DEBOUNCE_MS = 400;

interface UseCitySearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: GeocodingResult[];
  searching: boolean;
  noResults: boolean;
  handleSearch: () => void;
  resetSearch: () => void;
}

export function useCitySearch(): UseCitySearchReturn {
  const [searchQuery, setSearchQueryRaw] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    setSearching(true);
    setSearchResults([]);
    setNoResults(false);
    try {
      const results = await searchCities(query);
      setSearchResults(results);
      setNoResults(results.length === 0);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced auto-search on every keystroke
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      // Reset suggestion state when query is empty.

      setSearchResults([]);
      setNoResults(false);
      return;
    }
    const timer = setTimeout(() => void performSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryRaw(query);
  }, []);

  // Immediate search for button click / Enter key
  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (query) void performSearch(query);
  }, [searchQuery, performSearch]);

  const resetSearch = useCallback(() => {
    setSearchQueryRaw("");
    setSearchResults([]);
    setNoResults(false);
  }, []);

  return { searchQuery, setSearchQuery, searchResults, searching, noResults, handleSearch, resetSearch };
}
