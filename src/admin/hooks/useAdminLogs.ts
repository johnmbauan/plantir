import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { fetchAdminLogs, type AdminLog } from "@/admin/adminService";
import { getErrorMessage } from "@/utils/error";

export function useAdminLogs(serialNumber: string | null) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await fetchAdminLogs(serialNumber ?? undefined));
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error loading logs",
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [serialNumber]);

  useEffect(() => {
    // Intentionally trigger initial load for current dependencies.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { logs, loading, refresh };
}
