export interface WateringRow {
  userId: string;
  chatId: string;
  browserEnabled: boolean;
  plantId: number;
  plantName: string;
  imageUrl: string | null;
  humidity: number;
  potDepthClass: string | null;
  minHumidityThreshold: number;
  isOutdoor: boolean;
  weatherLat: number | null;
  weatherLng: number | null;
}

export interface OfflineRow {
  userId: string;
  chatId: string;
  browserEnabled: boolean;
  plantId: number;
  plantName: string;
  lastSeenAt: string | null;
  notificationTimezone: string;
}

export interface InsertedNotification {
  id: string;
  created_at: string;
}
