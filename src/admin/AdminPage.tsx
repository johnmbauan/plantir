import { Box, Tabs, Title } from "@mantine/core";
import { DevicesTab } from "@/admin/components/DevicesTab";
import { LogsTab } from "@/admin/components/LogsTab";
import { useAdminDevices } from "@/admin/hooks/useAdminDevices";

export default function AdminPage() {
  const { devices, loading, refresh } = useAdminDevices();

  return (
    <Box p="md">
      <Title order={2} c="var(--green-700)" mb="md">
        Admin Portal
      </Title>

      <Tabs defaultValue="devices">
        <Tabs.List mb="md">
          <Tabs.Tab value="devices">Devices</Tabs.Tab>
          <Tabs.Tab value="logs">Logs</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="devices" keepMounted={false}>
          <DevicesTab devices={devices} loading={loading} onRefresh={refresh} />
        </Tabs.Panel>

        <Tabs.Panel value="logs" keepMounted={false}>
          <LogsTab devices={devices} />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
