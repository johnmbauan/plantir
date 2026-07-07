import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { fetchAdminDevices, type AdminDevice } from "@/admin/adminService";
import { getErrorMessage } from "@/utils/error";

export function useAdminDevices() {
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDevices(await fetchAdminDevices());
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error loading devices",
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intentionally trigger initial load for current dependencies.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { devices, loading, refresh };
}
