import { useCallback, useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  startCalibrationMode,
  clearCalibrationMode,
  getLatestCalibrationReading,
  saveCalibrationValues,
  isCalibrationModeActive,
} from "@/services/deviceService";
import type { CalibrationReading } from "@/types";
import { getErrorMessage } from "@/utils/error";
import { isValidDryReading, isValidWetReading } from "../calibrationValidation";
import { STEP, isPollingStep } from "../calibrationSteps";

const POLL_INTERVAL_MS = 2000;
const READING_TIMEOUT_MS = 3 * 60 * 1000;

interface Options {
  opened: boolean;
  deviceId: number | null;
  onClose: () => void;
  onCalibrated?: () => void;
}

export function useCalibrationWizard({ opened, deviceId, onClose, onCalibrated }: Options) {
  // --- UI / flow state ---
  const [step, setStep] = useState(STEP.PREPARE as number);
  const [calibrationStarting, setCalibrationStarting] = useState(false);
  const [calibrationStarted, setCalibrationStarted] = useState(false);
  const [dryValue, setDryValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // --- Polling status surfaced to step UIs ---
  const [timedOut, setTimedOut] = useState(false);
  const [readingRejected, setReadingRejected] = useState(false);
  const [calibrationExpired, setCalibrationExpired] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);

  // ISO timestamp: only accept readings newer than this. Updating this state
  // remounts the poll effect (resets timeout / rejected flags).
  const [pollingSince, setPollingSince] = useState<string | null>(null);

  // Refs mirror values the interval callback must read without stale closures.
  const pollingSinceRef = useRef<string | null>(null);
  const readingArrivedAtRef = useRef<number | null>(null);
  const stepRef = useRef(step);
  const dryValueRef = useRef(dryValue);
  const calibrationStartedRef = useRef(calibrationStarted);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    dryValueRef.current = dryValue;
  }, [dryValue]);

  useEffect(() => {
    calibrationStartedRef.current = calibrationStarted;
  }, [calibrationStarted]);

  const beginPollingFrom = useCallback((isoTimestamp: string) => {
    pollingSinceRef.current = isoTimestamp;
    setPollingSince(isoTimestamp);
  }, []);

  const resetState = useCallback(() => {
    setStep(STEP.PREPARE);
    setCalibrationStarting(false);
    setCalibrationStarted(false);
    setPollingSince(null);
    setDryValue(null);
    setTimedOut(false);
    setSaving(false);
    setCountdownKey(0);
    setReadingRejected(false);
    setCalibrationExpired(false);
    pollingSinceRef.current = null;
    readingArrivedAtRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    if (deviceId && calibrationStarted && step < STEP.COMPLETE) {
      clearCalibrationMode(deviceId).catch((err) => {
        console.error("Failed to clear calibration mode on close:", err);
      });
    }
    resetState();
    onClose();
  }, [deviceId, calibrationStarted, step, resetState, onClose]);

  /** Return to the prepare step so the user can start calibration again. */
  const restartCalibration = useCallback(() => {
    setTimedOut(false);
    setReadingRejected(false);
    setCalibrationExpired(false);
    setDryValue(null);
    setStep(STEP.PREPARE);
    setCalibrationStarted(false);
    setPollingSince(null);
    pollingSinceRef.current = null;
  }, []);

  /**
   * Out-of-range reading: show a placement hint and skip this reading on the
   * next poll. Only update the ref — calling setPollingSince would remount the
   * poll effect and clear readingRejected via its reset timer.
   */
  const rejectReading = useCallback((reading: CalibrationReading) => {
    pollingSinceRef.current = reading.createdAt;
    setReadingRejected(true);
    setCountdownKey((k) => k + 1);
  }, []);

  const saveWetReading = useCallback(async (reading: CalibrationReading) => {
    const currentDryValue = dryValueRef.current;
    if (currentDryValue === null || !deviceId) return;

    beginPollingFrom(reading.createdAt);
    setSaving(true);

    try {
      await saveCalibrationValues(deviceId, currentDryValue, reading.rawValue);
      onCalibrated?.();
      setStep(STEP.COMPLETE);
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Error saving calibration",
        message: getErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  }, [deviceId, onCalibrated, beginPollingFrom]);

  // Poll while on wake / dry / wet steps. Handles timeout, mode expiry, and
  // advancing when a valid reading arrives.
  useEffect(() => {
    if (!opened || !deviceId || !pollingSince || calibrationExpired) return;
    if (!isPollingStep(step)) return;

    readingArrivedAtRef.current = Date.now();
    const resetTimer = window.setTimeout(() => {
      setTimedOut(false);
      setReadingRejected(false);
    }, 0);

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
        if (calibrationStartedRef.current) {
          const active = await isCalibrationModeActive(deviceId);
          if (!active) {
            window.clearInterval(intervalId);
            setCalibrationExpired(true);
            return;
          }
        }

        const since = pollingSinceRef.current ?? pollingSince;
        const reading = await getLatestCalibrationReading(deviceId, since);
        if (!reading) return;

        await handlePolledReading(reading, intervalId);
      } catch (err) {
        console.error("Calibration poll error:", err);
      }
    }, POLL_INTERVAL_MS);

    async function handlePolledReading(
      reading: CalibrationReading,
      intervalId: number,
    ) {
      const currentStep = stepRef.current;

      // First reading after start = device is awake → move to dry reading.
      if (currentStep === STEP.WAKE_DEVICE) {
        beginPollingFrom(reading.createdAt);
        setStep(STEP.DRY_READING);
        return;
      }

      if (currentStep === STEP.DRY_READING) {
        if (isValidDryReading(reading.rawValue)) {
          setDryValue(reading.rawValue);
          beginPollingFrom(reading.createdAt);
          setReadingRejected(false);
          setStep(STEP.WET_READING);
        } else {
          rejectReading(reading);
        }
        return;
      }

      if (currentStep === STEP.WET_READING) {
        if (isValidWetReading(reading.rawValue)) {
          window.clearInterval(intervalId);
          await saveWetReading(reading);
        } else {
          rejectReading(reading);
        }
      }
    }

    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(intervalId);
    };
  }, [
    opened,
    deviceId,
    step,
    pollingSince,
    calibrationExpired,
    rejectReading,
    saveWetReading,
    beginPollingFrom,
  ]);

  const handleNext = useCallback(async () => {
    if (step !== STEP.PREPARE || !deviceId || calibrationStarting) return;

    setCalibrationStarting(true);
    try {
      await startCalibrationMode(deviceId);
      beginPollingFrom(new Date().toISOString());
      setCalibrationStarted(true);
      setStep(STEP.WAKE_DEVICE);
    } catch (err) {
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setCalibrationStarting(false);
    }
  }, [step, deviceId, calibrationStarting, beginPollingFrom]);

  const prevStep = () => setStep((s) => Math.max(s - 1, STEP.PREPARE));

  return {
    step,
    calibrationStarting,
    timedOut,
    readingRejected,
    calibrationExpired,
    countdownKey,
    saving,
    isCompleted: step >= STEP.COMPLETE,
    isAutoAdvanceStep: isPollingStep(step),
    handleClose,
    handleNext,
    prevStep,
    restartCalibration,
  };
}
