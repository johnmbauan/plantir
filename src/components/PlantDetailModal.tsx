import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  CloseButton,
  Divider,
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
import { IconBattery, IconBucketDroplet, IconClock, IconDroplet, IconPencil, IconTool } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { EnrichedPlant, HistoryRange, PlantHistory } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { batteryMantineColor } from "@/utils/color-utils";
import { getErrorMessage } from "@/utils/error";
import { getEffectiveHumidity } from "@/utils/effectiveHumidity";
import { formatInterval, relativeTime } from "@/utils/time";
import HumidityBar from "@/components/HumidityBar";
import HistoryLineChart from "@/components/HistoryLineChart";
import { SpeciesCareCard } from "@/components/shared/SpeciesCareCard";
import { fetchLastWateredAt, fetchPlantHistory } from "@/services/plantService";
import { recordClientEvent, showUnlockToasts } from "@/services/achievementService";

const STATUS_LABEL_KEY: Record<string, string> = {
  HEALTHY: "plantStatus.healthy",
  WATERING_NEEDED: "plantStatus.needsWater",
  OFFLINE: "plantStatus.offline",
  RECHARGE_NEEDED: "plantStatus.needsRecharge",
};

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
  const { t } = useTranslation();
  const [range, setRange] = useState<HistoryRange>("7d");
  const [history, setHistory] = useState<PlantHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [lastWateredAt, setLastWateredAt] = useState<string | null>(null);
  const [lastWateredLoading, setLastWateredLoading] = useState(false);
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

  const loadLastWatered = useCallback(async (plantId: number) => {
    setLastWateredLoading(true);
    setLastWateredAt(null);

    try {
      const wateredAt = await fetchLastWateredAt(plantId);
      setLastWateredAt(wateredAt);
    } catch (error) {
      console.error("Failed to load last watered:", error);
      setLastWateredAt(null);
    } finally {
      setLastWateredLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!opened || !plant?.deviceId) return;
    // Loading depends on runtime plant/range state and is intentionally effect-driven.

    void loadHistory(plant.id, range);
  }, [opened, plant?.id, plant?.deviceId, range, loadHistory]);

  useEffect(() => {
    if (!opened || !plant?.deviceId) {
      setLastWateredAt(null);
      setLastWateredLoading(false);
      return;
    }

    void loadLastWatered(plant.id);
  }, [opened, plant?.id, plant?.deviceId, loadLastWatered]);

  useEffect(() => {
    if (!opened || range !== "30d") return;
    void recordClientEvent("viewed_30d_history")
      .then((newly) => showUnlockToasts(newly, t))
      .catch((err) => console.error("History achievement event failed:", err));
  }, [opened, range, t]);

  useEffect(() => {
    if (!opened) {
      setImageExpanded(false);
    }
  }, [opened]);

  const humidityHistoryPoints = useMemo(() => {
    if (!history) return [];
    return history.humidity.map((point) => ({
      ...point,
      value: getEffectiveHumidity(point.value, plant?.potDepthClass),
    }));
  }, [history, plant?.potDepthClass]);

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
                {t(STATUS_LABEL_KEY[s] ?? `plantStatus.${s.toLowerCase()}`)}
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
              {t("plantDetail.editPlant")}
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
                {t("plantDetail.editDevice")}
              </Button>
            )}
          </Group>
        </Group>

        {plant.image_url ? (
          <UnstyledButton
            onClick={() => setImageExpanded(true)}
            aria-label={t("plantDetail.viewFullSizeAria", { name: plant.name })}
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

        <Divider label={t("plantDetail.currentStatus")} labelPosition="center" mt={10} />
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <MetricCard
              icon={<IconDroplet size={14} />}
              label={t("plantDetail.humidity")}
              value={plant.humidityPercent != null ? `${plant.humidityPercent}%` : t("plantDetail.noReading")}
              color={barColor}
            >
              <HumidityBar
                humidityPercent={plant.humidityPercent}
                threshold={plant.threshold}
                barColor={barColor}
              />
            </MetricCard>
            <MetricCard
              icon={<IconBucketDroplet size={14} />}
              label={t("plantDetail.lastWatered")}
              value={
                plant.deviceId == null
                  ? t("plantDetail.noDevice")
                  : lastWateredLoading
                    ? "…"
                    : (relativeTime(lastWateredAt, t) ?? t("common.unknown"))
              }
              color="blue"
            />
            <MetricCard
              icon={<IconBattery size={14} />}
              label={t("plantDetail.battery")}
              value={plant.batteryPercent != null ? `${plant.batteryPercent}%` : t("plantDetail.noReading")}
              color={batteryMantineColor(plant.batteryPercent)}
            />
            <MetricCard
              icon={<IconClock size={14} />}
              label={t("plantDetail.reportingInterval")}
              value={plant.sleepDurationSeconds != null ? formatInterval(plant.sleepDurationSeconds, t) : t("plantDetail.noDevice")}
              color="gray"
            />
          </SimpleGrid>

        {plant.species && <SpeciesCareCard species={plant.species} />}

        {plant.deviceId == null && (
          <Alert color="green" variant="light" title={t("plantDetail.connectDeviceTitle")}>
            {t("plantDetail.connectDeviceBody")}
          </Alert>
        )}

        {plant.deviceId != null && (
          <Stack gap="xs">
            <Divider label={t("plantDetail.measurementHistory")} labelPosition="center" mt={10} />
            <Stack gap="xs">
            <Group justify="flex-end" align="center">
              <SegmentedControl
                size="xs"
                value={range}
                onChange={(value) => setRange(value as HistoryRange)}
                data={[
                  { label: t("plantDetail.range7d"), value: "7d" },
                  { label: t("plantDetail.range14d"), value: "14d" },
                  { label: t("plantDetail.range30d"), value: "30d" },
                  { label: t("plantDetail.range90d"), value: "90d" },
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
                  title={t("plantDetail.humidityTrend")}
                  points={humidityHistoryPoints}
                  color="var(--terracotta-500)"
                  unit="%"
                />
                <HistoryLineChart
                  title={t("plantDetail.batteryTrend")}
                  points={history.battery}
                  color="var(--mantine-color-green-6)"
                  unit="%"
                />
              </Stack>
            )}
            </Stack>
          </Stack>
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
            aria-label={t("plantDetail.fullSizeAria", { name: plant.name })}
          >
            <CloseButton
              pos="absolute"
              top={16}
              right={16}
              size="lg"
              variant="filled"
              color="gray"
              aria-label={t("plantDetail.closeFullSizeAria")}
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
