import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  CloseButton,
  Group,
  Image,
  Loader,
  LoadingOverlay,
  Modal,
  Overlay,
  Paper,
  Portal,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { IconBattery, IconClock, IconDroplet, IconPencil, IconTool } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import type { EnrichedPlant, HistoryRange, PlantHistory } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { batteryMantineColor } from "@/utils/color-utils";
import { formatInterval } from "@/utils/time";
import HumidityBar from "@/components/HumidityBar";
import HistoryLineChart from "@/components/HistoryLineChart";
import { ModalSection } from "@/components/shared/ModalSection";
import { SpeciesCareCard } from "@/components/shared/SpeciesCareCard";
import { fetchPlantHistory } from "@/services/plantService";
import { getErrorMessage } from "@/utils/error";

interface Props {
  plant: EnrichedPlant | null;
  opened: boolean;
  onClose: () => void;
}

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  color?: string;
  children?: ReactNode;
}

function MetricCard({ icon, label, value, color = "green", children }: MetricCardProps) {
  return (
    <Paper withBorder radius="md" p="sm" h="100%">
      <Stack gap={8} h="100%">
        <Group justify="space-between" align="start">
          <Group gap="xs">
            <ThemeIcon variant="light" color={color} size="sm">
              {icon}
            </ThemeIcon>
            <Text size="xs" c="dimmed">{label}</Text>
          </Group>
          <Text size="sm" fw={700}>{value}</Text>
        </Group>
        {children}
      </Stack>
    </Paper>
  );
}

export default function PlantDetailModal({ plant, opened, onClose }: Props) {
  const [range, setRange] = useState<HistoryRange>("24h");
  const [history, setHistory] = useState<PlantHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);

  const loadHistory = useCallback(async (plantId: number, selectedRange: HistoryRange) => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const data = await fetchPlantHistory(plantId, selectedRange);
      setHistory(data);
    } catch (error) {
      setHistoryError(getErrorMessage(error));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!opened || !plant?.deviceId) return;
    // Loading depends on runtime plant/range state and is intentionally effect-driven.

    void loadHistory(plant.id, range);
  }, [opened, plant?.id, plant?.deviceId, range, loadHistory]);

  useEffect(() => {
    if (!opened) {

      setImageExpanded(false);
    }
  }, [opened]);

  if (!plant) return null;

  const SEVERITY = ["OFFLINE", "WATERING_NEEDED", "HEALTHY"] as const;
  const primaryStatus = SEVERITY.find((s) => plant.statuses.includes(s)) ?? "HEALTHY";
  const { barColor } = STATUS_CONFIG[primaryStatus];

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>{plant.name}</Text>} size="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap={6}>
            {plant.statuses.map((s) => (
              <Badge key={s} color={STATUS_CONFIG[s].color} variant="light">
                {STATUS_CONFIG[s].label}
              </Badge>
            ))}
          </Group>
          <Group gap="xs">
            <Button
              component={Link}
              size="xs"
              variant="default"
              leftSection={<IconPencil size={14} />}
              to={`/plants-center?tab=plants&plantId=${plant.id}`}
              onClick={onClose}
            >
              Edit plant
            </Button>
            {plant.deviceId != null && (
              <Button
                component={Link}
                size="xs"
                variant="default"
                leftSection={<IconTool size={14} />}
                to={`/plants-center?tab=devices&deviceId=${plant.deviceId}`}
                onClick={onClose}
              >
                Edit device
              </Button>
            )}
          </Group>
        </Group>

        {plant.image_url ? (
          <UnstyledButton
            onClick={() => setImageExpanded(true)}
            aria-label={`View full size photo of ${plant.name}`}
            w="100%"
            style={{ borderRadius: "var(--mantine-radius-md)", cursor: "zoom-in" }}
          >
            <Image src={plant.image_url} alt={plant.name} radius="md" h={240} fit="cover" />
          </UnstyledButton>
        ) : (
          <Paper withBorder radius="md" py="xl">
            <Box ta="center" style={{ fontSize: 72 }}>🪴</Box>
          </Paper>
        )}

        <ModalSection title="Current status">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <MetricCard
              icon={<IconDroplet size={14} />}
              label="Humidity"
              value={plant.humidityPercent != null ? `${plant.humidityPercent}%` : "No reading"}
              color={barColor}
            >
              <HumidityBar
                humidityPercent={plant.humidityPercent}
                threshold={plant.threshold}
                barColor={barColor}
              />
            </MetricCard>
            <MetricCard
              icon={<IconBattery size={14} />}
              label="Battery"
              value={plant.batteryPercent != null ? `${plant.batteryPercent}%` : "No reading"}
              color={batteryMantineColor(plant.batteryPercent)}
            />
            <MetricCard
              icon={<IconClock size={14} />}
              label="Reporting interval"
              value={plant.sleepDurationSeconds != null ? formatInterval(plant.sleepDurationSeconds) : "No device"}
              color="gray"
            />
          </SimpleGrid>
        </ModalSection>

        {plant.species && <SpeciesCareCard species={plant.species} />}

        {plant.deviceId == null && (
          <Alert color="green" variant="light" title="Connect a device to track history">
            Assign a device to this plant to collect humidity, battery, and measurement history.
          </Alert>
        )}

        {plant.deviceId != null && (
          <ModalSection title="Measurement history">
            <Stack gap="xs">
            <Group justify="flex-end" align="center">
              <SegmentedControl
                size="xs"
                value={range}
                onChange={(value) => setRange(value as HistoryRange)}
                data={[
                  { label: "24h", value: "24h" },
                  { label: "7d", value: "7d" },
                  { label: "30d", value: "30d" },
                ]}
              />
            </Group>

            {historyError && !historyLoading && (
              <Alert color="red" variant="light">
                {historyError}
              </Alert>
            )}

            {!history && historyLoading && (
              <Stack gap="sm">
                <Skeleton h={178} radius="md" />
                <Skeleton h={178} radius="md" />
              </Stack>
            )}

            {history && !historyError && (
              <Stack gap="sm" pos="relative" mih={360}>
                <LoadingOverlay
                  visible={historyLoading}
                  loaderProps={{ children: <Loader size="sm" /> }}
                  overlayProps={{ radius: "sm", blur: 1, backgroundOpacity: 0.35 }}
                />
                <HistoryLineChart
                  title="Humidity trend"
                  points={history.humidity}
                  color="var(--terracotta-500)"
                  unit="%"
                />
                <HistoryLineChart
                  title="Battery trend"
                  points={history.battery}
                  color="var(--mantine-color-green-6)"
                  unit="%"
                />
              </Stack>
            )}
            </Stack>
          </ModalSection>
        )}
      </Stack>

      {plant.image_url && imageExpanded && (
        <Portal>
          <Overlay
            color="#000"
            backgroundOpacity={0.85}
            zIndex={400}
            onClick={() => setImageExpanded(false)}
          />
          <Box
            pos="fixed"
            inset={0}
            style={{ zIndex: 401, pointerEvents: "none" }}
            role="dialog"
            aria-modal="true"
            aria-label={`Full size photo of ${plant.name}`}
          >
            <CloseButton
              pos="absolute"
              top={16}
              right={16}
              size="lg"
              variant="filled"
              color="gray"
              aria-label="Close full size photo"
              onClick={() => setImageExpanded(false)}
              style={{ pointerEvents: "auto" }}
            />
            <Center h="100%" p="md">
              <Image
                src={plant.image_url}
                alt={plant.name}
                fit="contain"
                mah="calc(100vh - 4rem)"
                maw="min(90vw, 100%)"
                style={{ pointerEvents: "auto" }}
              />
            </Center>
          </Box>
        </Portal>
      )}
    </Modal>
  );
}
