import { Box, Paper, Tabs, Title } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { DevicesTab } from "@/admin/components/DevicesTab";
import { FirmwareTab } from "@/admin/components/FirmwareTab";
import { LogsTab } from "@/admin/components/LogsTab";
import type { AdminTab } from "@/admin/constants";
import { useAdminFilterOptions } from "@/admin/hooks/useAdminFilterOptions";
import classes from "@/admin/AdminPage.module.css";

const cardStyle = {
  border: "1px solid var(--terracotta-100)",
  background: "var(--surface)",
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
} as const;

function parseTab(value: string | null): AdminTab {
  if (value === "logs" || value === "firmware") return value;
  return "devices";
}

export default function AdminPage() {
  const { filterOptions, refresh: refreshFilterOptions } = useAdminFilterOptions();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  function handleTabChange(value: string | null) {
    if (!value) return;
    setSearchParams({ tab: value }, { replace: true });
  }

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100dvh - 56px - var(--mantine-spacing-md) * 2)",
      }}
    >
      <Paper radius="md" p={0} style={cardStyle}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          classNames={{
            list: classes.list,
            tab: classes.tab,
          }}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Box px="lg" pt="lg" pb={0}>
            <Title order={2} c="var(--green-700)" mb="sm" ta="center">
              Admin Portal
            </Title>
            <Tabs.List>
              <Tabs.Tab value="devices">Devices</Tabs.Tab>
              <Tabs.Tab value="logs">Logs</Tabs.Tab>
              <Tabs.Tab value="firmware">Firmware</Tabs.Tab>
            </Tabs.List>
          </Box>

          <Tabs.Panel
            value="devices"
            keepMounted={false}
            px="lg"
            pb="lg"
            pt="md"
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            <DevicesTab
              filterOptions={filterOptions}
              onRefreshFilters={refreshFilterOptions}
            />
          </Tabs.Panel>

          <Tabs.Panel
            value="logs"
            keepMounted={false}
            px="lg"
            pb="lg"
            pt="md"
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            <LogsTab
              filterOptions={filterOptions}
              onRefreshFilters={refreshFilterOptions}
            />
          </Tabs.Panel>

          <Tabs.Panel
            value="firmware"
            keepMounted={false}
            px="lg"
            pb="lg"
            pt="md"
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            <FirmwareTab />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Box>
  );
}
