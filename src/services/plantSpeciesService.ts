import supabase from "@/supabase";
import type { PlantSpecies } from "@/types";

export interface PlantSpeciesSearchItem {
  source: string;
  sourceSpeciesId: string;
  scientificName: string | null;
  displayName: string | null;
  imageUrl: string | null;
}

export interface SpeciesCareTranslation {
  soil: string | null;
  sunlight: string | null;
  watering: string | null;
  fertilization: string | null;
  pruning: string | null;
}

interface SearchResponse {
  results?: PlantSpeciesSearchItem[];
  error?: string;
}

interface DetailResponse {
  species?: PlantSpecies;
  error?: string;
}

interface TranslationResponse {
  translation?: SpeciesCareTranslation;
  error?: string;
}

export async function searchPlantSpecies(query: string, limit = 8): Promise<PlantSpeciesSearchItem[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const { data, error } = await supabase.functions.invoke("plant-species-search", {
    body: { q: normalizedQuery, limit },
  });

  if (error) throw error;

  const payload = (data ?? {}) as SearchResponse;
  if (payload.error) throw new Error(payload.error);

  return Array.isArray(payload.results) ? payload.results : [];
}

export async function fetchPlantSpeciesDetail(sourceSpeciesId: string): Promise<PlantSpecies> {
  const normalizedId = sourceSpeciesId.trim();
  if (!normalizedId) throw new Error("sourceSpeciesId is required");

  const { data, error } = await supabase.functions.invoke("plant-species-detail", {
    body: { sourceSpeciesId: normalizedId },
  });

  if (error) throw error;

  const payload = (data ?? {}) as DetailResponse;
  if (payload.error) throw new Error(payload.error);
  if (!payload.species) throw new Error("Invalid species detail response");

  return payload.species;
}

export async function fetchSpeciesTranslation(
  sourceSpeciesId: string,
  locale: string,
): Promise<SpeciesCareTranslation | null> {
  const normalizedId = sourceSpeciesId.trim();
  if (!normalizedId || locale === "en") return null;

  const { data, error } = await supabase.functions.invoke("translate-species-care", {
    body: { sourceSpeciesId: normalizedId, locale },
  });

  if (error) throw error;

  const payload = (data ?? {}) as TranslationResponse;
  if (payload.error) throw new Error(payload.error);

  return payload.translation ?? null;
}
