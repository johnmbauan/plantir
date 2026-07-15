import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  fetchAdminDevicesPage,
  type AdminDevicesQuery,
  type AdminDevice,
} from "@/admin/adminService";
import { getErrorMessage } from "@/utils/error";
import { paginationMeta } from "@/utils/pagination";

export function useAdminDevicesPage(query: AdminDevicesQuery) {
  const [items, setItems] = useState<AdminDevice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const currentPage = useMemo(
    () => paginationMeta(totalCount, query.page, query.pageSize).currentPage,
    [totalCount, query.page, query.pageSize],
  );

  const effectiveQuery = useMemo(
    () => ({ ...query, page: currentPage }),
    [query, currentPage],
  );

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const result = await fetchAdminDevicesPage(effectiveQuery);
      if (requestId !== requestIdRef.current) return;
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setItems([]);
      setTotalCount(0);
      notifications.show({
        color: "red",
        title: "Error loading devices",
        message: getErrorMessage(err),
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [effectiveQuery]);

  useEffect(() => {
    // Intentionally trigger initial load for current dependencies.

    void refresh();
  }, [refresh]);

  return { items, totalCount, loading, refresh, currentPage };
}
