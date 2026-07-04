import { useEffect, useState } from "react";
import { Progress, Text, Stack } from "@mantine/core";

const CYCLE_MS = 10000; // must match CALIBRATION_INTERVAL_MS in CalibrationRunner.cpp
const TICK_MS = 50;

export default function ReadingCountdownBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startMs = Date.now();
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startMs) % CYCLE_MS;
      setProgress((elapsed / CYCLE_MS) * 100);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Stack gap={4} mt="xs">
      <Progress value={progress} size="sm" color="green" />
      <Text size="xs" c="dimmed">The device sends a reading every 10 seconds</Text>
    </Stack>
  );
}
