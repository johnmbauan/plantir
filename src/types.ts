export type PlantStatus = "HEALTHY" | "WATERING_NEEDED" | "OFFLINE";

export interface EnrichedPlant {
  id: number;
  name: string;
  image_url: string | null;
  created_at: string;
  status: PlantStatus;
  humidityPercent: number | null;
  threshold: number | null;
  lastMeasuredAt: string | null;
}
