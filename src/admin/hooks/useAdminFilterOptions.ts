import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  fetchAdminFilterOptions,
  type AdminFilterOptions,
} from "@/admin/adminService";
import { getErrorMessage } from "@/utils/error";

const EMPTY_FILTER_OPTIONS: AdminFilterOptions = {
  serials: [],
  owners: [],
  plants: [],
  hasUnassignedOwner: false,
  hasUnassignedPlant: false,
};

export function useAdminFilterOptions() {
  const [filterOptions, setFilterOptions] = useState<AdminFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setFilterOptions(await fetchAdminFilterOptions());
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error loading filters",
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intentionally trigger initial load for current dependencies.

    void refresh();
  }, [refresh]);

  return { filterOptions, loading, refresh };
}
