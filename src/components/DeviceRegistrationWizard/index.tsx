import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Stepper, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPairingBundle, pollPairingToken } from "@/services/deviceService";
import type { PairingBundle } from "@/types";
import { getErrorMessage } from "@/utils/error";
import PrepareStep from "./steps/PrepareStep";
import OpenDeviceStep from "./steps/OpenDeviceStep";
import SetupCodeStep from "./steps/SetupCodeStep";
import ConnectStep from "./steps/ConnectStep";
import WaitingStep from "./steps/WaitingStep";
import CompletedStep from "./steps/CompletedStep";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

interface Props {
  opened: boolean;
  onClose: () => void;
  plantOptions: { value: string; label: string }[];
  onRegistered: () => void;
}

export default function DeviceRegistrationWizard({
  opened,
  onClose,
  plantOptions,
  onRegistered,
}: Props) {
  const [active, setActive] = useState(0);
  const [plantId, setPlantId] = useState<string | null>(null);
  const [pairing, setPairing] = useState<PairingBundle | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [registeredSerial, setRegisteredSerial] = useState<string | null>(null);
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
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setPairingLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    if (!opened) return;
    if (active === 2 && !pairing && !pairingLoading) {
      void generateBundle();
    }
  }, [opened, active, pairing, pairingLoading, generateBundle]);

  useEffect(() => {
    if (!opened || active !== 4 || !pairing) return;

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
          setActive(5);
          onRegistered();
        } else if (result.failed) {
          window.clearInterval(intervalId);
          setWaitingError(
            result.failureReason === "device_owned_by_another_user"
              ? "This device is already registered to a different account. If you believe this is your device, contact support."
              : "Registration failed. Please try again or contact support.",
          );
        }
      } catch (err) {
        console.error(err);
        window.clearInterval(intervalId);
        setWaitingError(getErrorMessage(err));
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [opened, active, pairing, onRegistered, pollGeneration]);

  const nextStep = () => setActive((current) => Math.min(current + 1, 5));
  const prevStep = () => setActive((current) => Math.max(current - 1, 0));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Register new device"
      size="lg"
      closeOnClickOutside={false}
    >
      <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false} size="sm" iconSize={22} styles={{ stepBody: { display: "none" } }}>
        <Stepper.Step label="Prepare">
          <PrepareStep plantOptions={plantOptions} plantId={plantId} onPlantChange={setPlantId} />
        </Stepper.Step>

        <Stepper.Step label="Open device">
          <OpenDeviceStep />
        </Stepper.Step>

        <Stepper.Step label="Setup code">
          <SetupCodeStep pairing={pairing} loading={pairingLoading} onGenerate={() => void generateBundle()} />
        </Stepper.Step>

        <Stepper.Step label="Connect">
          <ConnectStep />
        </Stepper.Step>

        <Stepper.Step label="Waiting">
          <WaitingStep
            timedOut={waitingTimedOut}
            error={waitingError}
            onKeepWaiting={() => { setWaitingTimedOut(false); setPollGeneration((n) => n + 1); }}
            onRegenerateCode={() => { setActive(2); setPairing(null); }}
          />
        </Stepper.Step>

        <Stepper.Completed>
          <CompletedStep registeredSerial={registeredSerial} />
        </Stepper.Completed>
      </Stepper>

      <Group justify="space-between" mt="xl">
        {active < 5 ? (
          <>
            <Button variant="default" onClick={active === 0 ? handleClose : prevStep}>
              {active === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              onClick={nextStep}
              disabled={(active === 2 && (!pairing || pairingLoading)) || active === 4}
            >
              {active === 3 ? "I've connected the device" : "Next"}
            </Button>
          </>
        ) : (
          <Button fullWidth onClick={handleClose}>
            Done
          </Button>
        )}
      </Group>
    </Modal>
  );
}
