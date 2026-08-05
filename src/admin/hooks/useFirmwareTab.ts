import { useCallback, useEffect, useState } from "react";
import {
  fetchFirmwareChannels,
  fetchFirmwareReleases,
  type FirmwareChannel,
  type FirmwareRelease,
} from "@/admin/adminService";

export function useFirmwareTab() {
  const [releases, setReleases] = useState<FirmwareRelease[]>([]);
  const [channels, setChannels] = useState<FirmwareChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextReleases, nextChannels] = await Promise.all([
        fetchFirmwareReleases(),
        fetchFirmwareChannels(),
      ]);
      setReleases(nextReleases);
      setChannels(nextChannels);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { releases, channels, loading, refresh };
}
