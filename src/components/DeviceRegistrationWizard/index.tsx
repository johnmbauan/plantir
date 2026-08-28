import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Stepper, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { createPairingBundle, pollPairingToken } from "@/services/deviceService";
import type { PairingBundle } from "@/types";
import { getErrorMessage } from "@/utils/error";
import { evaluateAndToastUnlocks } from "@/services/achievementService";
import PrepareStep from "./steps/PrepareStep";
import SetupCodeStep from "./steps/SetupCodeStep";
import ConnectStep from "./steps/ConnectStep";
import WaitingStep from "./steps/WaitingStep";
import CompletedStep from "./steps/CompletedStep";
import DeviceCalibrationWizard from "@/components/DeviceCalibrationWizard";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

import type { PlantOption } from "@/components/DeviceFormModal/types";

interface Props {
  opened: boolean;
  onClose: () => void;
  plantOptions: PlantOption[];
  onRegistered: () => void;
}

export default function DeviceRegistrationWizard({
  opened,
  onClose,
  plantOptions,
  onRegistered,
}: Props) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [plantId, setPlantId] = useState<string | null>(null);
  const [pairing, setPairing] = useState<PairingBundle | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [registeredSerial, setRegisteredSerial] = useState<string | null>(null);
  const [registeredDeviceId, setRegisteredDeviceId] = useState<number | null>(null);
  // Kept outside resetState so the calibration wizard can open after registration closes.
  const [calibrationWizardOpen, setCalibrationWizardOpen] = useState(false);
  const [calibrationTargetDeviceId, setCalibrationTargetDeviceId] = useState<number | null>(null);
  const [waitingTimedOut, setWaitingTimedOut] = useState(false);
  const [waitingError, setWaitingError] = useState<string | null>(null);
  const [pollGeneration, setPollGeneration] = useState(0);
  const pollStartedAtRef = useRef<number | null>(null);

  const resetState = useCallback(() => {
    setActive(0);
    setPlantId(null);
    setPairing(null);
    setPairingLoading(false);
    setRegisteredSerial(null);
    setRegisteredDeviceId(null);
    setWaitingTimedOut(false);
    setWaitingError(null);
    pollStartedAtRef.current = null;
    setPollGeneration(0);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const generateBundle = useCallback(async () => {
    setPairingLoading(true);
    try {
      const result = await createPairingBundle(plantId ? Number(plantId) : null);
      setPairing(result);
      setWaitingTimedOut(false);
      setWaitingError(null);
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      setPairingLoading(false);
    }
  }, [plantId, t]);

  useEffect(() => {
    if (!opened) return;
    if (active === 1 && !pairing && !pairingLoading) {
      // Trigger one bundle generation when setup-code step is first reached.
      void generateBundle();
    }
  }, [opened, active, pairing, pairingLoading, generateBundle]);

  useEffect(() => {
    if (!opened || active !== 3 || !pairing) return;


    pollStartedAtRef.current = Date.now();
    setWaitingTimedOut(false);
    setWaitingError(null);

    const intervalId = window.setInterval(async () => {
      if (pollStartedAtRef.current && Date.now() - pollStartedAtRef.current > POLL_TIMEOUT_MS) {
        window.clearInterval(intervalId);
        setWaitingTimedOut(true);
        return;
      }

      try {
        const result = await pollPairingToken(pairing.tokenId);
        if (result.used) {
          window.clearInterval(intervalId);
          setRegisteredSerial(result.serialNumber ?? null);
          setRegisteredDeviceId(result.deviceId ?? null);
          setActive(4);
          onRegistered();
          void evaluateAndToastUnlocks(t);
        } else if (result.failed) {
          window.clearInterval(intervalId);
          setWaitingError(
            result.failureReason === "device_owned_by_another_user"
              ? t("registrationWizard.waiting.ownedByAnother")
              : t("registrationWizard.waiting.registrationFailed"),
          );
        }
      } catch (err) {
        console.error(err);
        window.clearInterval(intervalId);
        setWaitingError(getErrorMessage(err));
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [opened, active, pairing, onRegistered, pollGeneration, t]);

  const nextStep = () => setActive((current) => Math.min(current + 1, 4));
  const prevStep = () => setActive((current) => Math.max(current - 1, 0));

  return (
    <>
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("registrationWizard.title")}
      size="lg"
      closeOnClickOutside={false}
    >
      <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false} size="sm" iconSize={22} styles={{ stepBody: { display: "none" } }}>
        <Stepper.Step label={t("registrationWizard.steps.prepare")}>
          <PrepareStep plantOptions={plantOptions} plantId={plantId} onPlantChange={setPlantId} />
        </Stepper.Step>

        <Stepper.Step label={t("registrationWizard.steps.setupCode")}>
          <SetupCodeStep pairing={pairing} loading={pairingLoading} onGenerate={() => void generateBundle()} />
        </Stepper.Step>

        <Stepper.Step label={t("registrationWizard.steps.connect")}>
          <ConnectStep />
        </Stepper.Step>

        <Stepper.Step label={t("registrationWizard.steps.waiting")}>
          <WaitingStep
            timedOut={waitingTimedOut}
            error={waitingError}
            onKeepWaiting={() => { setWaitingTimedOut(false); setPollGeneration((n) => n + 1); }}
            onRegenerateCode={() => { setActive(1); setPairing(null); }}
          />
        </Stepper.Step>

        <Stepper.Completed>
          <CompletedStep registeredSerial={registeredSerial} />
        </Stepper.Completed>
      </Stepper>

      <Group justify="space-between" mt="xl">
        {active < 4 ? (
          <>
            <Button variant="default" onClick={active === 0 ? handleClose : prevStep}>
              {active === 0 ? t("common.cancel") : t("common.back")}
            </Button>
            <Button
              onClick={nextStep}
              disabled={(active === 1 && (!pairing || pairingLoading)) || active === 3}
            >
              {active === 2 ? t("registrationWizard.connect.iveConnected") : t("common.next")}
            </Button>
          </>
        ) : (
          <Group justify="space-between" w="100%">
            <Button variant="default" onClick={handleClose}>
              {t("registrationWizard.completed.skipForNow")}
            </Button>
            <Button
              onClick={() => {
                // Capture ID before resetState clears it, then open calibration wizard.
                const id = registeredDeviceId;
                resetState();
                onClose();
                if (id) {
                  setCalibrationTargetDeviceId(id);
                  setCalibrationWizardOpen(true);
                }
              }}
              disabled={!registeredDeviceId}
            >
              {t("registrationWizard.completed.calibrateSensor")}
            </Button>
          </Group>
        )}
      </Group>

    </Modal>

    <DeviceCalibrationWizard
      opened={calibrationWizardOpen}
      onClose={() => {
        setCalibrationWizardOpen(false);
        setCalibrationTargetDeviceId(null);
      }}
      deviceId={calibrationTargetDeviceId}
      onCalibrated={onRegistered}
    />
    </>
  );
}
