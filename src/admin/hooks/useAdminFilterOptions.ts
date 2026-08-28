import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [filterOptions, setFilterOptions] = useState<AdminFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setFilterOptions(await fetchAdminFilterOptions());
    } catch (err) {
      notifications.show({
        color: "red",
        title: t("admin.filtersLoadError"),
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Intentionally trigger initial load for current dependencies.

    void refresh();
  }, [refresh]);

  return { filterOptions, loading, refresh };
}
