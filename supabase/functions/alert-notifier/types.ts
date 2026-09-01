export interface WateringRow {
  userId: string;
  chatId: string;
  browserEnabled: boolean;
  emailEnabled: boolean;
  email: string | null;
  plantId: number;
  plantName: string;
  imageUrl: string | null;
  humidity: number;
  potDepthClass: string | null;
  minHumidityThreshold: number;
  isOutdoor: boolean;
  weatherLat: number | null;
  weatherLng: number | null;
  locale: string;
  notificationTimezone: string;
}

export interface OfflineRow {
  userId: string;
  chatId: string;
  browserEnabled: boolean;
  emailEnabled: boolean;
  email: string | null;
  plantId: number;
  plantName: string;
  lastSeenAt: string | null;
  notificationTimezone: string;
  locale: string;
}

export interface InsertedNotification {
  id: string;
  created_at: string;
}

export interface WateringDigestItem {
  userId: string;
  email: string;
  locale: string;
  notificationTimezone: string;
  plantName: string;
  humidity: number;
  rainNote: string;
}

export interface OfflineDigestItem {
  userId: string;
  email: string;
  locale: string;
  notificationTimezone: string;
  plantName: string;
  lastSeenAt: string | null;
}
