import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  fetchAdminLogsPage,
  type AdminLogsQuery,
  type AdminLog,
} from "@/admin/adminService";
import { getErrorMessage } from "@/utils/error";

export function useAdminLogsPage(query: AdminLogsQuery) {
  const [items, setItems] = useState<AdminLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminLogsPage(query);
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error loading logs",
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    // Intentionally trigger initial load for current dependencies.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { items, totalCount, loading, refresh };
}
