import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Stepper, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  startCalibrationMode,
  clearCalibrationMode,
  getLatestCalibrationReading,
  saveCalibrationValues,
} from "@/services/deviceService";
import type { CalibrationReading } from "@/types";
import { getErrorMessage } from "@/utils/error";
import PrepareStep from "./steps/PrepareStep";
import OpenDeviceStep from "./steps/OpenDeviceStep";
import StartCalibrationStep from "./steps/StartCalibrationStep";
import DryReadingStep from "./steps/DryReadingStep";
import WetReadingStep from "./steps/WetReadingStep";
import CalibrationCompleteStep from "./steps/CalibrationCompleteStep";

const POLL_INTERVAL_MS = 2000;
const READING_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

interface Props {
  opened: boolean;
  onClose: () => void;
  deviceId: number | null;
  onCalibrated?: () => void;
}

export default function DeviceCalibrationWizard({ opened, onClose, deviceId, onCalibrated }: Props) {
  const [step, setStep] = useState(0);
  const [calibrationStarting, setCalibrationStarting] = useState(false);
  const [calibrationStarted, setCalibrationStarted] = useState(false);
  // ISO timestamp set when calibration mode is enabled; used as the `since` floor for polling.
  const [pollingSince, setPollingSince] = useState<string | null>(null);
  const [pendingReading, setPendingReading] = useState<CalibrationReading | null>(null);
  const [dryValue, setDryValue] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [saving, setSaving] = useState(false);

  const pollingSinceRef = useRef<string | null>(null);
  const readingArrivedAtRef = useRef<number | null>(null); // millis when polling phase began

  const resetState = useCallback(() => {
    setStep(0);
    setCalibrationStarting(false);
    setCalibrationStarted(false);
    setPollingSince(null);
    setPendingReading(null);
    setDryValue(null);
    setTimedOut(false);
    setSaving(false);
    pollingSinceRef.current = null;
    readingArrivedAtRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    if (deviceId && calibrationStarted && step < 5) {
      clearCalibrationMode(deviceId).catch((err) => {
        console.error("Failed to clear calibration mode on close:", err);
      });
    }
    resetState();
    onClose();
  }, [deviceId, calibrationStarted, step, resetState, onClose]);

  // Start calibration mode on the server.
  const handleStart = useCallback(async () => {
    if (!deviceId) return;
    setCalibrationStarting(true);
    try {
      await startCalibrationMode(deviceId);
      const now = new Date().toISOString();
      setPollingSince(now);
      pollingSinceRef.current = now;
      setCalibrationStarted(true);
    } catch (err) {
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setCalibrationStarting(false);
    }
  }, [deviceId]);

  // Poll for calibration readings on steps 2 (auto-advance), 3, and 4.
  useEffect(() => {
    if (!opened || !deviceId || !pollingSince) return;
    if (step < 2 || step > 4) return;

    readingArrivedAtRef.current = Date.now();
    setTimedOut(false);
    setPendingReading(null);

    const intervalId = window.setInterval(async () => {
      if (
        readingArrivedAtRef.current !== null &&
        Date.now() - readingArrivedAtRef.current > READING_TIMEOUT_MS
      ) {
        window.clearInterval(intervalId);
        setTimedOut(true);
        return;
      }

      try {
        const since = pollingSinceRef.current ?? pollingSince;
        const reading = await getLatestCalibrationReading(deviceId, since);
        if (reading) {
          if (step === 2) {
            // First reading arrived — device is connected, advance automatically.
            window.clearInterval(intervalId);
            setStep(3);
          } else {
            setPendingReading(reading);
          }
        }
      } catch (err) {
        console.error("Calibration poll error:", err);
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [opened, deviceId, step, pollingSince]);

  // ── Dry reading actions ───────────────────────────────────────────────────

  const handleDryAccept = useCallback(() => {
    if (!pendingReading) return;
    setDryValue(pendingReading.rawValue);
    // Advance `since` past this reading so the wet phase won't re-show it.
    pollingSinceRef.current = pendingReading.createdAt;
    setPollingSince(pendingReading.createdAt);
    setPendingReading(null);
    setStep(4);
  }, [pendingReading]);

  const handleDrySkip = useCallback(() => {
    if (!pendingReading) return;
    pollingSinceRef.current = pendingReading.createdAt;
    setPollingSince(pendingReading.createdAt);
    setPendingReading(null);
  }, [pendingReading]);

  const handleDryRetry = useCallback(() => {
    setTimedOut(false);
    setStep(2);
    setCalibrationStarted(false);
    setPollingSince(null);
    pollingSinceRef.current = null;
  }, []);

  // ── Wet reading actions ───────────────────────────────────────────────────

  const handleWetAccept = useCallback(async () => {
    if (!pendingReading || dryValue === null || !deviceId) return;
    setSaving(true);
    try {
      await saveCalibrationValues(deviceId, dryValue, pendingReading.rawValue);
      onCalibrated?.();
      setStep(5); // advances to Stepper.Completed
    } catch (err) {
      notifications.show({ color: "red", title: "Error saving calibration", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }, [pendingReading, dryValue, deviceId, onCalibrated]);

  const handleWetSkip = useCallback(() => {
    if (!pendingReading) return;
    pollingSinceRef.current = pendingReading.createdAt;
    setPollingSince(pendingReading.createdAt);
    setPendingReading(null);
  }, [pendingReading]);

  const handleWetRetry = useCallback(async () => {
    setTimedOut(false);
    setDryValue(null);
    setStep(2);
    setCalibrationStarted(false);
    setPollingSince(null);
    pollingSinceRef.current = null;
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const isCompleted = step >= 5;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Calibrate sensor"
      size="lg"
      closeOnClickOutside={false}
    >
      <Stepper
        active={step}
        allowNextStepsSelect={false}
        size="sm"
        iconSize={22}
        styles={{ stepBody: { display: "none" } }}
      >
        <Stepper.Step label="Prepare">
          <PrepareStep />
        </Stepper.Step>

        <Stepper.Step label="Open device">
          <OpenDeviceStep />
        </Stepper.Step>

        <Stepper.Step label="Start">
          <StartCalibrationStep
            started={calibrationStarted}
            loading={calibrationStarting}
            onStart={() => void handleStart()}
          />
        </Stepper.Step>

        <Stepper.Step label="Dry reading">
          <DryReadingStep
            pendingReading={pendingReading}
            timedOut={timedOut}
            onAccept={handleDryAccept}
            onSkip={handleDrySkip}
            onRetry={() => void handleDryRetry()}
          />
        </Stepper.Step>

        <Stepper.Step label="Wet reading">
          <WetReadingStep
            pendingReading={pendingReading}
            dryValue={dryValue}
            timedOut={timedOut}
            saving={saving}
            onAccept={() => void handleWetAccept()}
            onSkip={handleWetSkip}
            onRetry={() => void handleWetRetry()}
          />
        </Stepper.Step>

        <Stepper.Completed>
          <CalibrationCompleteStep />
        </Stepper.Completed>
      </Stepper>

      <Group justify="space-between" mt="xl">
        {isCompleted ? (
          <Button fullWidth onClick={handleClose}>
            Done
          </Button>
        ) : (step === 3 || step === 4) ? (
          // On reading steps, progress is via the Accept button inside the step —
          // no Next in the footer, Back is still available to restart.
          <Button variant="default" onClick={prevStep}>Back</Button>
        ) : (
          <>
            <Button variant="default" onClick={step === 0 ? handleClose : prevStep}>
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            <Button onClick={nextStep} disabled={step === 2 && !calibrationStarted}>
              Next
            </Button>
          </>
        )}
      </Group>
    </Modal>
  );
}
