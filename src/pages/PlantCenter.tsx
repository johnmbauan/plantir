import { useState } from "react";
import { Tabs, Title, Box } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import PlantsTab from "@/components/PlantsTab";
import DevicesTab from "@/components/DevicesTab";
import styles from "@/pages/PlantCenter.module.css";

const VALID_TABS = ["plants", "devices"] as const;
type TabValue = (typeof VALID_TABS)[number];

export default function PlantCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : "plants";

  const [mutationCount, setMutationCount] = useState(0);
  const handleMutated = () => setMutationCount((c) => c + 1);

  const handleTabChange = (value: string | null) => {
    if (value) setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <Box p="md">
      <Title order={2} c="var(--green-700)" mb="md" ta="center">
        Plants Center
      </Title>

      <Tabs value={activeTab} onChange={handleTabChange} classNames={{ list: styles.list, tab: styles.tab }}>
        <Tabs.List mb="md">
          <Tabs.Tab value="plants">Plants</Tabs.Tab>
          <Tabs.Tab value="devices">Devices</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="plants" keepMounted={false}>
          {activeTab === "plants" && <PlantsTab reloadKey={mutationCount} onMutated={handleMutated} />}
        </Tabs.Panel>

        <Tabs.Panel value="devices" keepMounted={false}>
          {activeTab === "devices" && <DevicesTab reloadKey={mutationCount} onMutated={handleMutated} />}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
