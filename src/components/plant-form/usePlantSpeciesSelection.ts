import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EnrichedPlant, PlantSpecies } from "@/types";
import { fetchPlantSpeciesDetail, searchPlantSpecies } from "@/services/plantSpeciesService";
import { getErrorMessage } from "@/utils/error";

export interface PlantSpeciesOption {
  value: string;
  label: string;
  scientificName: string | null;
}

const hydrateFromSummary = (plant: EnrichedPlant): PlantSpecies | null => {
  if (!plant.species) return null;
  return {
    ...plant.species,
    commonNames: plant.species.displayName ? [plant.species.displayName] : [],
    minEnvHumidity: null,
    maxEnvHumidity: null,
    minTemperatureCelsius: plant.species.minTemperatureCelsius,
    maxTemperatureCelsius: plant.species.maxTemperatureCelsius,
    sunlight: plant.species.sunlight ?? null,
    soil: plant.species.soil ?? null,
    watering: plant.species.watering ?? null,
    fertilization: plant.species.fertilization ?? null,
    pruning: plant.species.pruning ?? null,
    sourceUpdatedAt: null,
    createdAt: plant.created_at,
    updatedAt: plant.created_at,
  };
};

interface UsePlantSpeciesSelectionParams {
  opened: boolean;
}

export function usePlantSpeciesSelection({ opened }: UsePlantSpeciesSelectionParams) {
  const [speciesQuery, setSpeciesQuery] = useState("");
  const [speciesResults, setSpeciesResults] = useState<PlantSpeciesOption[]>([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<PlantSpecies | null>(null);
  const [useSpeciesImage, setUseSpeciesImage] = useState(false);
  const [speciesSearchLoading, setSpeciesSearchLoading] = useState(false);
  const [speciesDetailLoading, setSpeciesDetailLoading] = useState(false);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const searchReqRef = useRef(0);
  const detailReqRef = useRef(0);

  const selectedSpeciesLabel = useMemo(
    () => (
      selectedSpecies?.displayName
      ?? selectedSpecies?.scientificName
      ?? selectedSpecies?.sourceSpeciesId
      ?? ""
    ),
    [selectedSpecies],
  );

  const clearSpeciesSelection = useCallback(() => {
    setSpeciesQuery("");
    setSpeciesResults([]);
    setSelectedSpeciesId(null);
    setSelectedSpecies(null);
    setUseSpeciesImage(false);
    setSpeciesError(null);
  }, []);

  const initializeSpecies = useCallback((plant: EnrichedPlant | null) => {
    if (plant) {
      const prefilledSpecies = hydrateFromSummary(plant);
      setSelectedSpecies(prefilledSpecies);
      setSelectedSpeciesId(prefilledSpecies?.sourceSpeciesId ?? null);
      setSpeciesQuery(prefilledSpecies?.displayName ?? prefilledSpecies?.scientificName ?? "");
      setUseSpeciesImage(false);
      setSpeciesResults([]);
      setSpeciesError(null);
      return;
    }

    clearSpeciesSelection();
    setSpeciesSearchLoading(false);
    setSpeciesDetailLoading(false);
  }, [clearSpeciesSelection]);

  const handleSpeciesSearchChange = useCallback((value: string) => {
    setSpeciesQuery(value);
    if (selectedSpeciesId && value.trim() !== selectedSpeciesLabel) {
      setSelectedSpeciesId(null);
      setSelectedSpecies(null);
      setUseSpeciesImage(false);
    }
  }, [selectedSpeciesId, selectedSpeciesLabel]);

  useEffect(() => {
    if (!opened) return;
    if (selectedSpeciesId) return;
    const search = speciesQuery.trim();
    if (search.length < 2) {
      // Keep empty-results state in sync with short queries.

      setSpeciesResults([]);
      setSpeciesError(null);
      return;
    }

    const requestId = ++searchReqRef.current;
    // Mark async search lifecycle start before debounced request runs.
    setSpeciesSearchLoading(true);
    setSpeciesError(null);

    const timer = setTimeout(() => {
      void searchPlantSpecies(search)
        .then((results) => {
          if (requestId !== searchReqRef.current) return;
          setSpeciesResults(
            results.map((item) => ({
              value: item.sourceSpeciesId,
              label: item.displayName ?? item.scientificName ?? item.sourceSpeciesId,
              scientificName: item.scientificName,
            })),
          );
        })
        .catch((error) => {
          if (requestId !== searchReqRef.current) return;
          setSpeciesError(getErrorMessage(error));
          setSpeciesResults([]);
        })
        .finally(() => {
          if (requestId === searchReqRef.current) {
            setSpeciesSearchLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [speciesQuery, selectedSpeciesId, opened]);

  const handleSpeciesSelect = useCallback(async (sourceSpeciesId: string | null) => {
    setSelectedSpeciesId(sourceSpeciesId);
    setSpeciesError(null);
    if (!sourceSpeciesId) {
      setSelectedSpecies(null);
      setUseSpeciesImage(false);
      return;
    }

    const requestId = ++detailReqRef.current;
    setSpeciesDetailLoading(true);

    try {
      const species = await fetchPlantSpeciesDetail(sourceSpeciesId);
      if (requestId !== detailReqRef.current) return;
      setSelectedSpecies(species);
      setSpeciesQuery(species.displayName ?? species.scientificName ?? species.sourceSpeciesId);
      setUseSpeciesImage(false);
    } catch (error) {
      if (requestId !== detailReqRef.current) return;
      setSpeciesError(getErrorMessage(error));
      setSelectedSpecies(null);
      setSelectedSpeciesId(null);
    } finally {
      if (requestId === detailReqRef.current) {
        setSpeciesDetailLoading(false);
      }
    }
  }, []);

  return {
    speciesQuery,
    speciesResults,
    selectedSpeciesId,
    selectedSpecies,
    useSpeciesImage,
    speciesSearchLoading,
    speciesDetailLoading,
    speciesError,
    setUseSpeciesImage,
    clearSpeciesSelection,
    initializeSpecies,
    handleSpeciesSearchChange,
    handleSpeciesSelect,
  };
}
